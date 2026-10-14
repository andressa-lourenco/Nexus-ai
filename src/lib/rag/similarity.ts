export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface Scored<T> {
  item: T;
  score: number;
}

/** Ranks candidates by cosine similarity and keeps the best `k` above `minScore`. */
export function topK<T>(
  query: ArrayLike<number>,
  candidates: Iterable<T>,
  getVector: (item: T) => ArrayLike<number>,
  k: number,
  minScore = -1,
): Scored<T>[] {
  const scored: Scored<T>[] = [];
  for (const item of candidates) {
    const vector = getVector(item);
    if (vector.length !== query.length) continue;
    const score = cosineSimilarity(query, vector);
    if (score >= minScore) scored.push({ item, score });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, k);
}
