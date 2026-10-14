/** Tunables shared by server and client. Kept in one place so the UI can display them. */
export const RAG_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  minChunkLength: 30,
  maxChunksPerDocument: 600,
  topK: 6,
  minScore: 0.25,
  maxFileBytes: 4 * 1024 * 1024,
  maxPastedChars: 300_000,
  maxQuestionChars: 2_000,
  maxContextChars: 4_000,
  maxHistoryTurns: 6,
  acceptedExtensions: [".pdf", ".txt", ".md", ".markdown"],
} as const;
