// "Female/Male" on either side means "no sex restriction" (mirrors the backend).
export const BOTH_SEXES = 'female/male';

const AGE_RANGE_RE = /(\d{1,3})\s*(?:-|–|—|to)\s*(\d{1,3})/;
const AGE_MIN_RES = [
  /(\d{1,3})\s*(?:\+|and above|and older|or above|or older|and up)/,
  /(?:at least|minimum|min|over|above|older than|from)\D{0,4}(\d{1,3})/,
];
const AGE_MAX_RES = [
  /(\d{1,3})\s*(?:and below|and under|or below|or younger)/,
  /(?:up to|at most|maximum|max|under|below|younger than|no more than)\D{0,4}(\d{1,3})/,
];

/** Parse a free-text age requirement into `[min, max]` bounds (mirrors the backend). */
export const parseAgeRange = (text: string): [number | null, number | null] => {
  const lowered = text.trim().toLowerCase();
  const range = AGE_RANGE_RE.exec(lowered);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    return [Math.min(low, high), Math.max(low, high)];
  }
  for (const pattern of AGE_MIN_RES) {
    const match = pattern.exec(lowered);
    if (match) {
      return [Number(match[1]), null];
    }
  }
  for (const pattern of AGE_MAX_RES) {
    const match = pattern.exec(lowered);
    if (match) {
      return [null, Number(match[1])];
    }
  }
  return [null, null];
};

/** Human-readable label for parsed age bounds. */
export const ageRangeLabel = (low: number | null, high: number | null): string => {
  if (low !== null && high !== null) {
    return `${low}–${high}`;
  }
  if (low !== null) {
    return `${low}+`;
  }
  return `up to ${high}`;
};
