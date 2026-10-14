import "server-only";
import { ApiError } from "./errors";
import { getServerConfig } from "./config";

type Message = { role: "system" | "user" | "assistant"; content: string };

function requireKey(): string {
  const { apiKey } = getServerConfig();
  if (!apiKey) {
    throw new ApiError(
      503,
      "not_configured",
      "The AI provider is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY in the server environment.",
    );
  }
  return apiKey;
}

async function providerError(response: Response): Promise<ApiError> {
  let detail = "";
  try {
    const body = await response.json();
    detail = body?.error?.message ?? "";
  } catch {
    /* ignore non-JSON bodies */
  }
  console.error("[nexus] provider error", response.status, detail);
  if (response.status === 401 || response.status === 403) {
    return new ApiError(502, "provider_auth", detail ? `The AI provider rejected the API key: ${detail}` : "The AI provider rejected the API key.");
  }
  if (response.status === 429) {
    return new ApiError(503, "provider_rate_limited", "The AI provider is rate limiting requests. Please retry shortly.");
  }
  return new ApiError(502, "provider_error", detail ? `The AI provider returned an error: ${detail}` : "The AI provider returned an error. Please try again.");
}

import { embedTextsGemini, streamChatGemini } from "./gemini";

const EMBEDDING_BATCH = 96;

/** Embeds texts in batches, preserving order. Vectors are rounded to keep payloads small. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { provider } = getServerConfig();
  if (provider === "gemini") {
    return embedTextsGemini(texts);
  }

  const apiKey = requireKey();
  const { baseUrl, embeddingModel, dimensions } = getServerConfig();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH);
    const body: Record<string, unknown> = { model: embeddingModel, input: batch, dimensions };

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw await providerError(response);
    const json = (await response.json()) as { data: { index?: number; embedding: number[] }[] };
    const ordered = [...json.data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const row of ordered) vectors.push(row.embedding.map((v) => Math.round(v * 1e6) / 1e6));
  }
  return vectors;
}

/** Streams a chat completion as plain UTF-8 text deltas. */
export async function streamChat(messages: Message[], signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const { provider } = getServerConfig();
  if (provider === "gemini") {
    return streamChatGemini(messages, signal);
  }

  const apiKey = requireKey();
  const { baseUrl, chatModel } = getServerConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: chatModel, messages, temperature: 0.1, stream: true }),
    signal,
  });
  if (!response.ok || !response.body) throw await providerError(response);

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
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            await reader.cancel().catch(() => {});
            return;
          }
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
              emitted = true;
            }
          } catch {
            /* skip keep-alive or malformed lines */
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
