import { Chart } from 'chart.js';

/** Fallback stack; mirrors `body { font-family }` in styles.scss (Lato). */
const FALLBACK_FONT = "Lato, 'Helvetica Neue', sans-serif";

/**
 * The app's UI font family, read from the rendered document so it always tracks
 * the system typography (Material `typography: Lato`) rather than duplicating it.
 */
export function systemFontFamily(): string {
  if (typeof document === 'undefined') return FALLBACK_FONT;
  const family = getComputedStyle(document.body).fontFamily;
  return family?.trim() || FALLBACK_FONT;
}

let applied = false;

/**
 * Point Chart.js's global font family at the system font, so axis ticks — and
 * any plugin text built from `Chart.defaults.font.family` — match the rest of
 * the UI. Idempotent: safe to call from every chart component's constructor.
 */
export function useSystemChartFont(): void {
  if (applied) return;
  Chart.defaults.font.family = systemFontFamily();
  applied = true;
}
