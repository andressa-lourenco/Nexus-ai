import { RAG_CONFIG } from "./config";
import type { Chunk } from "./types";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkLength?: number;
}

export interface PageText {
  page: number | null;
  text: string;
}

const SENTENCE_BOUNDARY = /(?<=[.!?…;:])\s+|\n+/;

/** Splits text into sentence-like units, hard-wrapping any unit longer than `max`. */
export function splitIntoUnits(text: string, max: number): string[] {
  const units: string[] = [];
  for (const raw of text.split(SENTENCE_BOUNDARY)) {
    const unit = raw.trim();
    if (!unit) continue;
    if (unit.length <= max) {
      units.push(unit);
      continue;
    }
    let current = "";
    for (const word of unit.split(/\s+/)) {
      if (word.length > max) {
        if (current) units.push(current);
        current = "";
        for (let i = 0; i < word.length; i += max) units.push(word.slice(i, i + max));
        continue;
      }
      if (current && current.length + 1 + word.length > max) {
        units.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) units.push(current);
  }
  return units;
}

/**
 * Greedy sentence-aware chunking with overlap. Each chunk stays within `chunkSize`
 * characters and begins with up to `chunkOverlap` characters of trailing context
 * from the previous chunk, so facts that span a boundary remain retrievable.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const size = options.chunkSize ?? RAG_CONFIG.chunkSize;
  const overlap = Math.min(options.chunkOverlap ?? RAG_CONFIG.chunkOverlap, Math.floor(size / 2));
  const minLength = options.minChunkLength ?? RAG_CONFIG.minChunkLength;

  const units = splitIntoUnits(text, size);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;
  let hasNewContent = false;

  const join = (parts: string[]) => parts.join(" ");

  for (const unit of units) {
    const added = currentLength === 0 ? unit.length : currentLength + 1 + unit.length;
    if (added > size && current.length > 0) {
      if (hasNewContent) chunks.push(join(current));
      const tail: string[] = [];
      let tailLength = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const len = current[i].length + (tail.length ? 1 : 0);
        if (tailLength + len > overlap) break;
        tail.unshift(current[i]);
        tailLength += len;
      }
      while (tail.length && tailLength + 1 + unit.length > size) {
        tailLength -= tail.shift()!.length + 1;
      }
      current = tail;
      currentLength = tail.length ? join(tail).length : 0;
      hasNewContent = false;
    }
    current.push(unit);
    currentLength = currentLength === 0 ? unit.length : currentLength + 1 + unit.length;
    hasNewContent = true;
  }
  if (current.length && hasNewContent) chunks.push(join(current));

  return chunks.filter((c) => c.length >= minLength || chunks.length === 1);
}

/** Chunks every page independently so each chunk maps to exactly one page. */
export function chunkPages(pages: PageText[], options: ChunkOptions = {}): Chunk[] {
  const result: Chunk[] = [];
  for (const { page, text } of pages) {
    for (const piece of chunkText(text, options)) {
      result.push({ index: result.length, text: piece, page });
    }
  }
  return result;
}
