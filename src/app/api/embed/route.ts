import { NextResponse } from "next/server";
import { RAG_CONFIG } from "@/lib/rag/config";
import { ApiError, errorResponse } from "@/lib/server/errors";
import { embedTexts } from "@/lib/server/openai";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getServerConfig } from "@/lib/server/config";

export const runtime = "nodejs";

/** Embeds a search query so the client can rank its locally stored chunks. */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request);
    const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) throw new ApiError(400, "empty_query", "The question is empty.");
    if (query.length > RAG_CONFIG.maxQuestionChars) throw new ApiError(413, "query_too_long", "The question is too long.");

    const [embedding] = await embedTexts([query]);
    return NextResponse.json({ embedding, model: getServerConfig().embeddingModel });
  } catch (error) {
    return errorResponse(error);
  }
}
