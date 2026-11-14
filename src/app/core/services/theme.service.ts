import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'light-mc' | 'light-hc' | 'dark' | 'dark-mc' | 'dark-hc';

const THEME_MODES: readonly ThemeMode[] = [
  'light',
  'light-mc',
  'light-hc',
  'dark',
  'dark-mc',
  'dark-hc',
];
const STORAGE_KEY = 'theme';
const DEFAULT_MODE: ThemeMode = 'light';

/**
 * Owns the active colour theme. The theme is the class on `<body>` (see
 * `src/styles/theme/*.css`). Light is the default; the user's choice is
 * persisted so it survives reloads. `index.html` applies the saved class before
 * Angular boots to avoid a light flash for dark-mode users.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _mode = signal<ThemeMode>(this.readSaved());

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode().startsWith('dark'));

  constructor() {
    this.apply(this._mode());
  }

  set(mode: ThemeMode): void {
    // Apply the class before updating the signal so anything derived from
    // `mode()` (e.g. chart colours read from computed styles) sees the new theme.
    this.apply(mode);
    this._mode.set(mode);
  }

  toggleDark(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  private apply(mode: ThemeMode): void {
    const body = this.document.body;
    body.classList.remove(...THEME_MODES);
    body.classList.add(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the
      // theme still applies for this session.
    }
  }

  private readSaved(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (THEME_MODES as readonly string[]).includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {
      // Fall through to the default.
    }
    return DEFAULT_MODE;
  }
}
