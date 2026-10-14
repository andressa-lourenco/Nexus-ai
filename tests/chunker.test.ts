import { describe, expect, it } from "vitest";
import { chunkPages, chunkText, splitIntoUnits } from "@/lib/rag/chunker";
import { normalizeText } from "@/lib/rag/text";

const sentence = (i: number) => `Sentence number ${i} explains an important idea about retrieval.`;

describe("normalizeText", () => {
  it("joins hyphenated line breaks and collapses whitespace", () => {
    expect(normalizeText("Retrie-\nval   augmented\r\n\n\n\ngeneration ")).toBe("Retrieval augmented\n\ngeneration");
  });
});

describe("splitIntoUnits", () => {
  it("hard-wraps units longer than the limit", () => {
    const units = splitIntoUnits("word ".repeat(100).trim(), 50);
    expect(units.every((u) => u.length <= 50)).toBe(true);
    expect(units.join(" ").split(" ")).toHaveLength(100);
  });
});

describe("chunkText", () => {
  const text = Array.from({ length: 60 }, (_, i) => sentence(i)).join(" ");

  it("keeps every chunk within the size limit", () => {
    const chunks = chunkText(text, { chunkSize: 300, chunkOverlap: 80 });
    expect(chunks.length).toBeGreaterThan(5);
    expect(chunks.every((c) => c.length <= 300)).toBe(true);
  });

  it("overlaps consecutive chunks", () => {
    const chunks = chunkText(text, { chunkSize: 300, chunkOverlap: 80 });
    for (let i = 1; i < chunks.length; i++) {
      const firstSentence = chunks[i].split(/(?<=\.)\s/)[0];
      expect(chunks[i - 1]).toContain(firstSentence);
    }
  });

  it("covers all the original content", () => {
    const chunks = chunkText(text, { chunkSize: 300, chunkOverlap: 80 }).join(" ");
    for (let i = 0; i < 60; i++) expect(chunks).toContain(sentence(i));
  });

  it("returns a single chunk for short text", () => {
    expect(chunkText("Short note.")).toEqual(["Short note."]);
  });
});

describe("chunkPages", () => {
  it("assigns page numbers and sequential indexes", () => {
    const chunks = chunkPages(
      [
        { page: 1, text: Array.from({ length: 20 }, (_, i) => sentence(i)).join(" ") },
        { page: 2, text: "The second page has its own content that is long enough." },
      ],
      { chunkSize: 400, chunkOverlap: 100 },
    );
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    expect(chunks.at(-1)?.page).toBe(2);
    expect(chunks.filter((c) => c.page === 2)).toHaveLength(1);
  });
});
