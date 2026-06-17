---
name: material-theming
description: Angular Material M3 theming guide for this project. Use when adding theme variants, adjusting colors/typography, creating themed components, or wiring a theme toggle. Covers --md-sys-color-* tokens, the --mat-sys-* bridge in styles.scss, and signal-driven theme switching.
---

# Angular Material Theming (M3)

This project uses Angular Material M3 with a custom token bridge. Light/dark/high-contrast/medium-contrast variants are defined as CSS classes on `<body>`.

## Architecture

- `src/styles/theme/{light,light-hc,light-mc,dark,dark-hc,dark-mc}.css` define `.light`, `.dark`, `.light-hc`, … classes. Each class sets `--md-sys-color-*` tokens (M3 spec).
- `src/styles.scss`:
  - Calls `mat.theme({ color, typography, density })` once on `html` to emit Material's structural tokens.
  - Bridges `--md-sys-color-*` → `--mat-sys-*` inside the six theme class selectors. Only color tokens are bridged — typography is global.
  - Sets body `font-family` and `color-scheme: dark` for dark variants.
- The active theme is the class applied to `<body>` (see `src/index.html`).

## Rules

1. **Never hardcode hex colors in component styles.** Use `var(--mat-sys-primary)`, `var(--mat-sys-surface)`, etc. If a token doesn't exist, add it to the bridge in `styles.scss`.
2. **All six theme variants must work.** When you add or rename a CSS variable in the bridge, update all six selector groups (`.light, .light-hc, .light-mc, .dark, .dark-hc, .dark-mc`).
3. **Typography is one font for the whole app** (passed once to `mat.theme(...)`). Per-component font overrides are an anti-pattern.
4. **Dark-mode-only rules** belong in the `.dark, .dark-hc, .dark-mc` selector group, not inside `@media (prefers-color-scheme: dark)`.

## Common token reference

Use these instead of raw colors:

| Use case                | Token                                |
| ----------------------- | ------------------------------------ |
| Page background         | `--mat-sys-background`               |
| Card / surface          | `--mat-sys-surface`                  |
| Subtle container        | `--mat-sys-surface-container`        |
| Brand action            | `--mat-sys-primary`                  |
| Text on brand action    | `--mat-sys-on-primary`               |
| Secondary action        | `--mat-sys-secondary`                |
| Error state             | `--mat-sys-error`                    |
| Body text on background | `--mat-sys-on-background`            |
| Borders / outlines      | `--mat-sys-outline-variant`          |

## Adding a new color token

If you need a token not in the current bridge:

1. Add it to all six `.light/.dark/...` blocks in `src/styles.scss` mapping `--mat-sys-foo` → `var(--md-sys-color-foo)`.
2. Confirm the underlying `--md-sys-color-foo` exists in `src/styles/theme/*.css`. If not, regenerate the theme files from M3 (Material Theme Builder) — do NOT hand-edit individual variants.

## Generating new theme files

Use the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) with your seed color, export as "Web (CSS)", and replace the contents of `src/styles/theme/*.css`. Keep the class names (`.light`, `.dark`, etc.) intact.

## Theme switching with signals

Drive the body class from a signal so OnPush components react.

```ts
// theme.service.ts
export type ThemeMode = 'light' | 'light-hc' | 'light-mc' | 'dark' | 'dark-hc' | 'dark-mc';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.initial());
  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode().startsWith('dark'));

  constructor() {
    effect(() => {
      const mode = this._mode();
      document.body.classList.remove(
        'light', 'light-hc', 'light-mc', 'dark', 'dark-hc', 'dark-mc',
      );
      document.body.classList.add(mode);
      localStorage.setItem('theme', mode);
    });
  }

  set(mode: ThemeMode) { this._mode.set(mode); }
  toggleDark() { this._mode.update(m => (m.startsWith('dark') ? 'light' : 'dark')); }

  private initial(): ThemeMode {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved) return saved;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

The `effect()` is doing a side effect (DOM mutation + localStorage write) — this is the right use case. Do NOT write back to other signals from inside.

## Component styling pattern

```scss
:host {
  display: block;
  background: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: 12px;
}

:host[data-state='error'] {
  background: var(--mat-sys-error-container);
  color: var(--mat-sys-on-error-container);
}
```

## Density and typography

- `density: 0` is the project default (full-size components). Don't change globally — override per component with `mat.density-*` mixins if needed.
- `typography:` in `mat.theme(...)` accepts a font family name. Whatever's passed must also be loaded via a `<link>` in `index.html`.

## Anti-patterns to flag

- ❌ Hardcoded hex/rgb in component CSS
- ❌ `@media (prefers-color-scheme: dark)` — use the `.dark` class instead so manual override works
- ❌ Per-component `font-family` overrides
- ❌ Editing only one of the six theme variant files
- ❌ Reading the active theme by inspecting `document.body.classList` from a component — inject `ThemeService` and read `mode()`
