/**
 * Parse an HTTP `Retry-After` header (delta-seconds) into a whole number of
 * seconds, clamped to a sane minimum. Returns `null` when the header is absent
 * or not a positive integer (the spec also allows an HTTP-date, which the
 * backend never sends, so it is treated as unknown).
 */
export function parseRetryAfterSeconds(header: string | null | undefined): number | null {
  if (!header) {
    return null;
  }
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return Math.ceil(seconds);
}

/** Human-friendly "in N minutes/seconds" phrase for a Retry-After delay. */
export function formatRetryAfter(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `in ${seconds} second${seconds === 1 ? '' : 's'}`;
}

/** Snackbar/error copy for a 429 response, using `Retry-After` when present. */
export function retryAfterMessage(header: string | null | undefined): string {
  const seconds = parseRetryAfterSeconds(header);
  const when = seconds === null ? 'in a few minutes' : formatRetryAfter(seconds);
  return `Too many attempts. Please try again ${when}.`;
}
