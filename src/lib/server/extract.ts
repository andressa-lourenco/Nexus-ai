import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { ApiError } from "./errors";
import type { PageText } from "@/lib/rag/chunker";
import type { DocumentKind } from "@/lib/rag/types";
import { normalizeText } from "@/lib/rag/text";

export interface ExtractedDocument {
  kind: DocumentKind;
  mimeType: string;
  pages: PageText[];
  pageCount: number | null;
}

export function detectKind(fileName: string, mimeType: string): DocumentKind | null {
  const name = fileName.toLowerCase();
  if (mimeType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".md") || name.endsWith(".markdown") || mimeType === "text/markdown") return "markdown";
  if (name.endsWith(".txt") || mimeType === "text/plain") return "text";
  return null;
}

export async function extractFromFile(file: File): Promise<ExtractedDocument> {
  const kind = detectKind(file.name, file.type);
  if (!kind) throw new ApiError(415, "unsupported_type", "Unsupported file type. Upload a PDF, TXT or Markdown file.");

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (kind === "pdf") {
    let pages: string[];
    let totalPages: number;
    try {
      const pdf = await getDocumentProxy(bytes);
      ({ text: pages, totalPages } = await extractText(pdf, { mergePages: false }));
    } catch (error) {
      console.error("[nexus] pdf parse failed", error);
      throw new ApiError(422, "unreadable_pdf", "This PDF could not be read. It may be encrypted or corrupted.");
    }
    return {
      kind,
      mimeType: "application/pdf",
      pageCount: totalPages,
      pages: pages.map((text, i) => ({ page: i + 1, text: normalizeText(text) })).filter((p) => p.text),
    };
  }

  const text = normalizeText(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  return {
    kind,
    mimeType: kind === "markdown" ? "text/markdown" : "text/plain",
    pageCount: null,
    pages: text ? [{ page: null, text }] : [],
  };
}

export function extractFromPastedText(text: string): ExtractedDocument {
  const normalized = normalizeText(text);
  return {
    kind: "text",
    mimeType: "text/plain",
    pageCount: null,
    pages: normalized ? [{ page: null, text: normalized }] : [],
  };
}
