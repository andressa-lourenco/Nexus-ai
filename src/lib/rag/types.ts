export interface Chunk {
  index: number;
  text: string;
  /** 1-based page number for paginated sources (PDF); null for plain text. */
  page: number | null;
}

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

/** Payload returned by /api/ingest. The client persists it as a StoredDocument. */
export interface IngestedDocument {
  name: string;
  mimeType: string;
  kind: DocumentKind;
  size: number;
  pageCount: number | null;
  charCount: number;
  wordCount: number;
  embeddingModel: string;
  dimensions: number;
  chunks: EmbeddedChunk[];
}

export type DocumentKind = "pdf" | "markdown" | "text";

export interface StoredDocument extends IngestedDocument {
  id: string;
  createdAt: number;
}

export type DocumentSummary = Omit<StoredDocument, "chunks"> & { chunkCount: number };

/** A retrieved chunk sent to the generator and shown to the user as a source. */
export interface SourceRef {
  /** 1-based citation number used in the answer, e.g. [1]. */
  n: number;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  page: number | null;
  score: number;
  text: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface HealthStatus {
  configured: boolean;
  provider?: string;
  chatModel: string;
  embeddingModel: string;
  dimensions: number;
}
