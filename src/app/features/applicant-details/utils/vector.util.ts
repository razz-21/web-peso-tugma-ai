/** Split a dense vector into `bins` contiguous chunks, each reduced to its L2 magnitude. */
export const poolMagnitudes = (vector: readonly number[], bins: number): number[] => {
  const out: number[] = [];
  const size = vector.length / bins;
  for (let i = 0; i < bins; i++) {
    const start = Math.floor(i * size);
    const end = Math.floor((i + 1) * size);
    let sumSquares = 0;
    for (let j = start; j < end; j++) {
      sumSquares += vector[j] * vector[j];
    }
    out.push(Math.sqrt(sumSquares));
  }
  return out;
};

/** Cosine similarity clamped to [0, 1], matching the backend's semantic component. */
export const cosineSimilarity = (a: readonly number[], b: readonly number[]): number => {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, dot / denom));
};
