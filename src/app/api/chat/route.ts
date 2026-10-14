import { RAG_CONFIG } from "@/lib/rag/config";
import { buildMessages, type PromptSource } from "@/lib/rag/prompt";
import type { ChatTurn } from "@/lib/rag/types";
import { ApiError, errorResponse } from "@/lib/server/errors";
import { streamChat } from "@/lib/server/openai";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function parseSources(value: unknown): PromptSource[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, RAG_CONFIG.topK).map((raw, i) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const page = typeof s.page === "number" && Number.isInteger(s.page) ? s.page : null;
    return {
      n: i + 1,
      documentName: str(s.documentName, 160) || "Document",
      page,
      text: str(s.text, RAG_CONFIG.maxContextChars),
    };
  }).filter((s) => s.text.trim());
}

function parseHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-RAG_CONFIG.maxHistoryTurns)
    .filter((t): t is ChatTurn => (t?.role === "user" || t?.role === "assistant") && typeof t?.content === "string")
    .map((t) => ({ role: t.role, content: t.content.slice(0, RAG_CONFIG.maxContextChars) }));
}

/** Generates a grounded answer from sources retrieved by the client. Streams plain text. */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const question = str(body?.question, RAG_CONFIG.maxQuestionChars + 1).trim();
    if (!question) throw new ApiError(400, "empty_question", "The question is empty.");
    if (question.length > RAG_CONFIG.maxQuestionChars) throw new ApiError(413, "question_too_long", "The question is too long.");

    const sources = parseSources(body?.sources);
    if (sources.length === 0) {
      throw new ApiError(400, "no_sources", "No relevant passages were provided, so there is nothing to ground an answer on.");
    }

    const stream = await streamChat(buildMessages(question, sources, parseHistory(body?.history)), request.signal);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
