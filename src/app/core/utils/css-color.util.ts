import { DOCUMENT } from '@angular/common';
import { Signal, computed, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';

/** Turns a colour that may be a `var(--token)` reference into a concrete colour. */
export type ColorResolver = (color: string) => string;

const VAR_REF = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/;

/**
 * Resolves a `var(--token)` string against an element's computed style; any
 * other colour passes through unchanged. Canvas APIs (Chart.js) cannot read CSS
 * custom properties, so chart code calls this right before drawing.
 */
export function resolveCssColor(element: Element, color: string): string {
  const match = VAR_REF.exec(color.trim());
  if (!match) {
    return color;
  }
  const value = getComputedStyle(element).getPropertyValue(match[1]).trim();
  return value || match[2]?.trim() || color;
}

/** Returns `color` (an `rgb()` or 6-digit hex string) at the given alpha. */
export function withAlpha(color: string, alpha: number): string {
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color);
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color;
}

/**
 * A resolver for theme tokens that changes whenever the theme does. Read it
 * inside a chart's `computed()` options/data so the chart re-renders with the
 * new palette on a light/dark switch.
 */
export function injectCssColorResolver(): Signal<ColorResolver> {
  const theme = inject(ThemeService);
  const body = inject(DOCUMENT).body;
  return computed(() => {
    theme.mode();
    const cache = new Map<string, string>();
    return (color: string) => {
      let resolved = cache.get(color);
      if (resolved === undefined) {
        resolved = resolveCssColor(body, color);
        cache.set(color, resolved);
      }
      return resolved;
    };
  });
}
