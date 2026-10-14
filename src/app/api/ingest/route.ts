import { NextResponse } from "next/server";
import { RAG_CONFIG } from "@/lib/rag/config";
import { chunkPages } from "@/lib/rag/chunker";
import { countWords } from "@/lib/rag/text";
import type { IngestedDocument } from "@/lib/rag/types";
import { ApiError, errorResponse } from "@/lib/server/errors";
import { extractFromFile, extractFromPastedText, type ExtractedDocument } from "@/lib/server/extract";
import { embedTexts } from "@/lib/server/openai";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getServerConfig } from "@/lib/server/config";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanName(name: string): string {
  return name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 160) || "Untitled document";
}

async function readInput(request: Request): Promise<{ name: string; size: number; extracted: ExtractedDocument }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was provided.");
    if (file.size === 0) throw new ApiError(400, "empty_file", "The file is empty.");
    if (file.size > RAG_CONFIG.maxFileBytes) {
      throw new ApiError(413, "file_too_large", `Files must be smaller than ${RAG_CONFIG.maxFileBytes / 1024 / 1024} MB.`);
    }
    return { name: cleanName(file.name), size: file.size, extracted: await extractFromFile(file) };
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { title?: unknown; text?: unknown } | null;
    const text = typeof body?.text === "string" ? body.text : "";
    const title = typeof body?.title === "string" ? body.title : "";
    if (!text.trim()) throw new ApiError(400, "empty_text", "Paste some text to index.");
    if (text.length > RAG_CONFIG.maxPastedChars) {
      throw new ApiError(413, "text_too_large", `Pasted text is limited to ${RAG_CONFIG.maxPastedChars.toLocaleString("en-US")} characters.`);
    }
    return { name: cleanName(title || "Pasted note"), size: new TextEncoder().encode(text).length, extracted: extractFromPastedText(text) };
  }

  throw new ApiError(415, "unsupported_content_type", "Send a multipart file upload or JSON text.");
}

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, 2);
    const { name, size, extracted } = await readInput(request);

    const chunks = chunkPages(extracted.pages);
    if (chunks.length === 0) {
      throw new ApiError(
        422,
        "no_text",
        extracted.kind === "pdf"
          ? "No selectable text was found. Scanned PDFs need OCR before they can be indexed."
          : "The document does not contain any text.",
      );
    }
    if (chunks.length > RAG_CONFIG.maxChunksPerDocument) {
      throw new ApiError(413, "too_many_chunks", `This document is too long (${chunks.length} chunks). The limit is ${RAG_CONFIG.maxChunksPerDocument}.`);
    }

    const embeddings = await embedTexts(chunks.map((c) => c.text));
    const { embeddingModel, dimensions } = getServerConfig();
    const fullText = extracted.pages.map((p) => p.text).join("\n\n");

    const document: IngestedDocument = {
      name,
      mimeType: extracted.mimeType,
      kind: extracted.kind,
      size,
      pageCount: extracted.pageCount,
      charCount: fullText.length,
      wordCount: countWords(fullText),
      embeddingModel,
      dimensions: embeddings[0]?.length ?? dimensions,
      chunks: chunks.map((c, i) => ({ ...c, embedding: embeddings[i] })),
    };
    return NextResponse.json({ document });
  } catch (error) {
    return errorResponse(error);
  }
}
