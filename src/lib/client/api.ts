import type { HealthStatus, IngestedDocument, SourceRef, ChatTurn } from "@/lib/rag/types";

export class ClientApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}

async function toError(response: Response): Promise<ClientApiError> {
  try {
    const body = await response.json();
    if (body?.error?.message) return new ClientApiError(body.error.message, body.error.code ?? "error", response.status);
  } catch {
    /* fall through */
  }
  if (response.status === 413) return new ClientApiError("The upload is too large for the server.", "too_large", 413);
  return new ClientApiError(`Request failed (${response.status}).`, "http_error", response.status);
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ClientApiError("Network error. Check your connection and try again.", "network", 0);
  }
  if (!response.ok) throw await toError(response);
  return response.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthStatus> {
  return request<HealthStatus>("/api/health", { cache: "no-store" });
}

export async function ingestFile(file: File): Promise<IngestedDocument> {
  const form = new FormData();
  form.append("file", file);
  const { document } = await request<{ document: IngestedDocument }>("/api/ingest", { method: "POST", body: form });
  return document;
}

export async function ingestText(title: string, text: string): Promise<IngestedDocument> {
  const { document } = await request<{ document: IngestedDocument }>("/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  });
  return document;
}

export async function embedQuery(query: string, signal?: AbortSignal): Promise<number[]> {
  const { embedding } = await request<{ embedding: number[] }>("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  return embedding;
}

export async function streamAnswer(
  question: string,
  sources: SourceRef[],
  history: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        history,
        sources: sources.map(({ documentName, page, text }) => ({ documentName, page, text })),
      }),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ClientApiError("Network error. Check your connection and try again.", "network", 0);
  }
  if (!response.ok || !response.body) throw await toError(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
}
