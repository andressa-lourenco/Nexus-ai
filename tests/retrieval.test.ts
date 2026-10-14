import { describe, expect, it } from "vitest";
import { retrieve } from "@/lib/rag/retrieve";
import { cosineSimilarity, topK } from "@/lib/rag/similarity";
import type { StoredDocument } from "@/lib/rag/types";

describe("cosineSimilarity", () => {
  it("handles identical, orthogonal and mismatched vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("topK", () => {
  it("sorts by score and applies k and threshold", () => {
    const items = [[1, 0], [0.9, 0.1], [0, 1], [0.5, 0.5]];
    const result = topK([1, 0], items, (v) => v, 2, 0.1);
    expect(result.map((r) => r.item)).toEqual([[1, 0], [0.9, 0.1]]);
    expect(topK([1, 0], items, (v) => v, 10, 0.5)).toHaveLength(3);
  });
});

function doc(id: string, vectors: number[][], dimensions = 2): StoredDocument {
  return {
    id,
    name: `${id}.pdf`,
    mimeType: "application/pdf",
    kind: "pdf",
    size: 1,
    pageCount: 1,
    charCount: 1,
    wordCount: 1,
    embeddingModel: "test",
    dimensions,
    createdAt: 0,
    chunks: vectors.map((embedding, index) => ({ index, text: `${id}-${index}`, page: index + 1, embedding })),
  };
}

describe("retrieve", () => {
  it("ranks chunks across documents, numbers sources and skips incompatible vectors", () => {
    const docs = [doc("a", [[1, 0], [0, 1]]), doc("b", [[0.8, 0.2]]), doc("c", [[1, 0, 0]], 3)];
    const sources = retrieve([1, 0], docs, 5, 0.3);
    expect(sources.map((s) => s.text)).toEqual(["a-0", "b-0"]);
    expect(sources.map((s) => s.n)).toEqual([1, 2]);
    expect(sources[0]).toMatchObject({ documentId: "a", documentName: "a.pdf", page: 1, chunkIndex: 0 });
  });

  it("returns nothing when no chunk passes the threshold", () => {
    expect(retrieve([1, 0], [doc("a", [[0, 1]])], 5, 0.25)).toEqual([]);
  });
});
