import "server-only";
import { ApiError } from "./errors";
import { getServerConfig } from "./config";

export type Message = { role: "system" | "user" | "assistant"; content: string };

function requireKey(): string {
  const { apiKey } = getServerConfig();
  if (!apiKey) {
    throw new ApiError(
      503,
      "not_configured",
      "The AI provider is not configured. Set GEMINI_API_KEY in the server environment.",
    );
  }
  return apiKey;
}

async function geminiError(response: Response): Promise<ApiError> {
  let detail = "";
  try {
    const body = await response.json();
    detail = body?.error?.message ?? "";
  } catch {
    /* ignore non-JSON bodies */
  }
  console.error("[nexus] gemini error", response.status, detail);
  if (response.status === 401 || response.status === 403) {
    return new ApiError(
      502,
      "provider_auth",
      detail
        ? `The Gemini provider rejected the API key: ${detail}`
        : "The Gemini provider rejected the API key.",
    );
  }
  if (response.status === 429) {
    return new ApiError(
      503,
      "provider_rate_limited",
      "The Gemini provider rate limit was exceeded. Please retry shortly.",
    );
  }
  if (response.status === 503) {
    return new ApiError(
      503,
      "provider_unavailable",
      "The Gemini model is temporarily experiencing high demand. Please try again in a moment.",
    );
  }
  return new ApiError(
    502,
    "provider_error",
    detail
      ? `The Gemini provider returned an error: ${detail}`
      : "The Gemini provider returned an error. Please try again.",
  );
}

const EMBEDDING_BATCH = 96;

/** Embeds texts using Gemini's native batchEmbedContents API */
export async function embedTextsGemini(texts: string[]): Promise<number[][]> {
  const apiKey = requireKey();
  const { embeddingModel } = getServerConfig();
  const cleanModel = embeddingModel.replace(/^models\//, "");
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:batchEmbedContents`;

    const requests = batch.map((text) => ({
      model: `models/${cleanModel}`,
      content: { parts: [{ text }] },
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) throw await geminiError(response);
    const json = (await response.json()) as { embeddings?: { values?: number[] }[] };

    if (!json.embeddings || json.embeddings.length === 0) {
      throw new ApiError(
        502,
        "provider_error",
        "The Gemini embedding API returned an empty response.",
      );
    }

    for (const item of json.embeddings) {
      const values = item.values ?? [];
      vectors.push(values.map((v) => Math.round(v * 1e6) / 1e6));
    }
  }

  return vectors;
}

/** Formats OpenAI-style messages into Gemini contents and systemInstruction */
function formatGeminiContents(messages: Message[]) {
  let systemText = "";
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemText += (systemText ? "\n\n" : "") + msg.content;
      continue;
    }

    const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];

    if (last && last.role === role) {
      last.parts.push({ text: msg.content });
    } else {
      contents.push({ role, parts: [{ text: msg.content }] });
    }
  }

  // Ensure conversation starts with user if not empty
  if (contents.length > 0 && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }

  return {
    contents,
    systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
  };
}

/** Streams chat completion using Gemini's native streamGenerateContent (SSE) */
export async function streamChatGemini(
  messages: Message[],
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = requireKey();
  const { chatModel } = getServerConfig();
  const primaryModel = chatModel.replace(/^models\//, "");

  // Candidate models in case of temporary 503 high-demand spike
  const candidateModels = Array.from(
    new Set([
      primaryModel,
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemma-4-26b-a4b-it",
      "gemini-flash-latest",
    ]),
  );

  const { contents, systemInstruction } = formatGeminiContents(messages);
  const payload: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.1 },
  };
  if (systemInstruction) {
    payload.systemInstruction = systemInstruction;
  }

  let response: Response | null = null;
  let lastError: ApiError | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (res.ok && res.body) {
        response = res;
        break;
      }

      const err = await geminiError(res);
      lastError = err;
      // If error is 503 (demand spike) or 404 (model unavailable), try next model
      if (res.status !== 503 && res.status !== 404) {
        throw err;
      }
    } catch (e) {
      if (e instanceof ApiError && e.status !== 503 && e.status !== 404) {
        throw e;
      }
      if ((e as Error).name === "AbortError") throw e;
    }
  }

  if (!response || !response.body) {
    throw (
      lastError ??
      new ApiError(
        503,
        "provider_unavailable",
        "All Gemini models are temporarily unavailable. Please retry in a moment.",
      )
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        let emitted = false;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            const candidates = data?.candidates;
            if (candidates && candidates.length > 0) {
              const parts = candidates[0]?.content?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  // Only emit visible text, ignore internal thoughts/signatures
                  if (typeof part.text === "string" && part.text) {
                    controller.enqueue(encoder.encode(part.text));
                    emitted = true;
                  }
                }
              }
            }
          } catch {
            /* ignore non-JSON or keep-alive lines */
          }
        }

        if (emitted) return;
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
}
