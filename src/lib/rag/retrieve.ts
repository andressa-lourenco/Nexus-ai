import { RAG_CONFIG } from "./config";
import { topK } from "./similarity";
import type { EmbeddedChunk, SourceRef, StoredDocument } from "./types";

interface Candidate {
  doc: StoredDocument;
  chunk: EmbeddedChunk;
}

/** Semantic search across every stored chunk. Returns numbered sources ready for citation. */
export function retrieve(
  queryEmbedding: number[],
  documents: StoredDocument[],
  k: number = RAG_CONFIG.topK,
  minScore: number = RAG_CONFIG.minScore,
): SourceRef[] {
  function* candidates(): Generator<Candidate> {
    for (const doc of documents) {
      if (doc.dimensions !== queryEmbedding.length) continue;
      for (const chunk of doc.chunks) yield { doc, chunk };
    }
  }
  return topK(queryEmbedding, candidates(), (c) => c.chunk.embedding, k, minScore).map(({ item, score }, i) => ({
    n: i + 1,
    documentId: item.doc.id,
    documentName: item.doc.name,
    chunkIndex: item.chunk.index,
    page: item.chunk.page,
    score,
    text: item.chunk.text,
  }));
}
