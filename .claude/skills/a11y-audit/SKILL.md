---
name: a11y-audit
description: Accessibility review checklist for Angular Material UI. Use after adding/modifying any user-facing component — runs WCAG AA + AXE checks covering ARIA, focus management, color contrast against theme tokens, keyboard nav, and signal-driven a11y state.
---

# Accessibility Audit (WCAG AA + AXE)

This project's CLAUDE.md requires every UI change to pass AXE and meet WCAG AA. Use this skill to review or build accessibly.

## Quick verification commands

```bash
# AXE-core via puppeteer/playwright (preferred in CI)
npx @axe-core/cli http://localhost:4200

# Lighthouse accessibility audit
npx lighthouse http://localhost:4200 --only-categories=accessibility --view
```

The Angular CDK provides `LiveAnnouncer`, `FocusMonitor`, `FocusTrap`, and `A11yModule` — use these instead of hand-rolling a11y.

## Review checklist

Work through this every time. Each item is non-negotiable for AA.

### 1. Semantic HTML first

- Use `<button>` for actions, `<a>` for navigation. Never `<div (click)>`.
- Headings in order: `<h1>` → `<h2>` → `<h3>`. One `<h1>` per route.
- Lists: `<ul>`/`<ol>` for actual lists. Not styled `<div>`s.
- `<main>`, `<nav>`, `<header>`, `<footer>` landmarks per page.
- Forms inside `<form>`, every input paired with a `<label>` (or `<mat-label>`).

### 2. Labels and names

- Every interactive control has an accessible name. Check via `aria-label`, `aria-labelledby`, or visible text.
- Icon-only buttons MUST have `aria-label`:

```html
<button mat-icon-button aria-label="Close dialog" (click)="close()">
  <mat-icon>close</mat-icon>
</button>
```

- `<img>`: meaningful images have `alt="…"`; decorative images use `alt=""` (not omitted).
- Form fields: prefer `<mat-form-field>` with `<mat-label>` so the label is wired to the input automatically.

### 3. Focus management

- Visible focus indicator on every interactive element. Don't `outline: none` without replacing it.
- Tab order matches visual order — avoid `tabindex` > 0.
- After navigation: move focus to the new view's `<h1>` or first interactive control. Use `Router` events + signal-driven `effect()`:

```ts
constructor() {
  const heading = viewChild<ElementRef<HTMLElement>>('pageHeading');
  effect(() => {
    queueMicrotask(() => heading()?.nativeElement.focus());
  });
}
```

- Dialogs / overlays: trap focus inside (Material's `MatDialog` does this automatically). On close, restore focus to the trigger.
- "Skip to main content" link at the top of the layout.

### 4. Color contrast

All contrast checks should use the actual theme tokens, not approximations.

- Text on background: ≥ **4.5:1** (normal), **3:1** (≥18pt or 14pt bold).
- UI components / focus indicators / icons conveying meaning: ≥ **3:1**.
- Test in **all six theme variants** (light, light-hc, light-mc, dark, dark-hc, dark-mc) — the high-contrast variants exist for users who need them; never break them.

If a token pair fails contrast, fix the theme definition in `src/styles/theme/*.css`, not the component. See `material-theming` skill.

### 5. Keyboard navigation

Every feature must be operable without a mouse.

- All `(click)` handlers must also work via keyboard. `<button>`/`<a>` give this for free. For custom interactive elements, also handle Enter/Space and add `tabindex="0"` + `role`.
- Custom widgets follow [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) patterns:
  - Combobox: arrow keys, Enter to select, Escape to close
  - Menu: arrow keys, Home/End, type-ahead
  - Dialog: Escape closes, focus trapped, restored on close

Use CDK helpers:

```ts
import { ListKeyManager } from '@angular/cdk/a11y';
// or
@if (true) {} // use Material components that ship with correct keyboard behavior
```

### 6. ARIA — minimum required

- `aria-expanded` on disclosure triggers (accordions, menus).
- `aria-current="page"` on the active nav link.
- `aria-live="polite"` (or use CDK `LiveAnnouncer`) for async status messages.
- `aria-invalid="true"` + `aria-describedby` linking to the error message for invalid form fields. Material does this when you wire `<mat-error>` correctly.
- `aria-busy="true"` on a region while it's loading.

Signal-driven example:

```ts
readonly loading = signal(false);
readonly errors = computed(() => /* derive from form */);
```

```html
<form [attr.aria-busy]="loading()">
  <input matInput [control]="form.email"
         [attr.aria-invalid]="!!errors()"
         [attr.aria-describedby]="errors() ? 'email-err' : null" />
  @if (errors(); as e) { <mat-error id="email-err">{{ e }}</mat-error> }
</form>
```

Forms are built with Signal Forms (`form()` + `[control]`) — see `signal-forms` skill.

`null` (not `false` or `''`) removes an `attr.aria-*` binding cleanly.

### 7. Reduced motion

Respect the user's preference.

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

Or guard CDK animations with a signal:

```ts
readonly reducedMotion = toSignal(
  fromEvent<MediaQueryList>(matchMedia('(prefers-reduced-motion: reduce)'), 'change'),
  { initialValue: matchMedia('(prefers-reduced-motion: reduce)') },
).pipe(/* … */); // or use a simpler matchMedia wrapper service
```

### 8. Announcing async changes

Use the CDK's `LiveAnnouncer` for transient messages (snackbar-like, but for SR users).

```ts
private readonly announcer = inject(LiveAnnouncer);

save() {
  this.api.save(this.form.getRawValue()).subscribe(() => {
    this.announcer.announce('Loan application submitted', 'polite');
  });
}
```

For region-level live updates, set `aria-live="polite"` (or `assertive` for errors) on the region.

### 9. Form errors

- Errors must be programmatically associated (`aria-describedby`) — see ARIA section.
- Errors must be in text, not color alone.
- Error summary at the top of long forms with anchor links to each field.
- On submit-with-errors: move focus to the first invalid field.

### 10. Touch targets

Minimum **44×44px** for interactive elements (WCAG 2.5.5 AAA, but project target). Material's default density (0) meets this — be cautious with `mat.density-2` or smaller.

## Quick AXE-violation triage

| AXE rule                         | Fix                                                  |
| -------------------------------- | ---------------------------------------------------- |
| `button-name`                    | Add `aria-label` to icon button                      |
| `image-alt`                      | Add `alt=""` (decorative) or `alt="…"` (meaningful)  |
| `color-contrast`                 | Fix theme token in `src/styles/theme/*.css`          |
| `label`                          | Wrap input in `<mat-form-field>` with `<mat-label>`  |
| `link-name`                      | Add visible text or `aria-label`                     |
| `landmark-one-main`              | Wrap page content in `<main>`                        |
| `aria-required-children`         | Use the correct ARIA pattern from WAI-APG            |
| `nested-interactive`             | Don't put `<a>`/`<button>` inside another            |
| `heading-order`                  | Fix `h*` nesting                                     |
| `region`                         | Add landmark elements                                |

## Anti-patterns to flag

- ❌ `<div (click)>` instead of `<button>`
- ❌ `outline: none` without a replacement focus style
- ❌ Color-only error indication
- ❌ Modal that doesn't trap focus or restore on close
- ❌ Icon-only button with no `aria-label`
- ❌ `tabindex="-1"` to "hide" something — use `inert` (Angular 17+) or unmount
- ❌ `placeholder` used as the label
- ❌ Skipping heading levels (h1 → h3)
- ❌ Animations without a `prefers-reduced-motion` guard
