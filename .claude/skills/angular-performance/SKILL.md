---
name: angular-performance
description: Performance review for signals-first Angular apps. Use when investigating slow renders, bundle size growth, jank, or before shipping any large feature. Covers signals + OnPush, @defer, trackBy, change detection profiling, image/font optimization, and route/lazy chunk hygiene.
---

# Angular Performance

This project is signals-first with OnPush. That alone covers the biggest CD wins. Use this skill to push further.

## Signals + OnPush — what you get for free

With every component on `ChangeDetectionStrategy.OnPush` and state in signals:

- A signal write only dirties components that *read that exact signal*. Sibling subtrees and unrelated components are skipped.
- No zone-flush-the-world after every event. Zoneless mode (see below) further reduces this.
- No `markForCheck()` calls scattered through the code.

This is the entire reason the codebase enforces both. Don't break the pattern.

### Zoneless (recommended for new work)

```ts
// main.ts
bootstrapApplication(App, {
  providers: [provideExperimentalZonelessChangeDetection(), /* … */],
});
```

Removes Zone.js — only signal changes (and explicit `ChangeDetectorRef.markForCheck`) trigger CD. Verify with the Angular DevTools profiler: tick count should drop dramatically.

## Template-side wins

### `@for` MUST have `track`

`track` is required syntactically, but pick the right value. `track $index` is wrong for most lists — it forces re-render of every node when items shift.

```html
<!-- ✅ Identity-based -->
@for (loan of loans(); track loan.id) { <app-loan-row [loan]="loan" /> }

<!-- ❌ Re-renders all rows when list reorders -->
@for (loan of loans(); track $index) { … }
```

### `@defer` for below-the-fold / heavy widgets

```html
@defer (on viewport) {
  <app-heavy-chart [data]="data()" />
} @placeholder {
  <div class="chart-skeleton"></div>
} @loading (after 100ms; minimum 300ms) {
  <mat-spinner />
} @error {
  <p>Chart failed to load</p>
}
```

Triggers: `on viewport`, `on idle`, `on hover`, `on interaction`, `on timer(2s)`, or `when condition()`. The deferred block ships as a separate chunk — only downloaded when triggered.

Use for:
- Below-the-fold widgets
- Modals / dialogs whose templates are heavy
- Charts, rich text editors, map components

### `@let` instead of repeated function calls

If you call `expensive()` three times in a template, hoist it:

```html
@let user = currentUser();
<header>{{ user.name }}</header>
<p>{{ user.email }}</p>
<small>{{ user.role }}</small>
```

`@let` is a template-local binding — no signal/computed needed for simple template-scope hoisting.

### Avoid function calls in bindings

```html
<!-- ❌ Recomputes every CD cycle -->
<p>{{ formatTotal(items) }}</p>

<!-- ✅ Hoist to computed -->
<p>{{ formattedTotal() }}</p>
```

```ts
readonly formattedTotal = computed(() => formatTotal(this.items()));
```

## Image / font / CSS

### Images

Use `NgOptimizedImage` for every static raster image:

```html
<img ngSrc="hero.webp" width="1200" height="600" priority sizes="100vw" />
```

- `priority` for LCP images (avoid for below-the-fold).
- `width`/`height` are required and reserve layout space (prevents CLS).
- `ngSrcset` for responsive variants.
- Does NOT work for inline base64 — skip the directive there.

### Fonts

- `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` (already in `index.html`).
- `&display=swap` on Google Fonts URLs (already set).
- Subset font weights — only request the weights you actually use.
- For self-hosted fonts: `font-display: swap;` in `@font-face`.

### CSS

- Component styles are scoped — no global selector cost.
- Avoid deep descendant selectors. `:host > .row` is fine; `:host .a .b .c .d` is not.
- Prefer `transform`/`opacity` for animations (compositor-only). Avoid animating `width`/`height`/`top`/`left`.
- Respect `prefers-reduced-motion` (see `a11y-audit` skill).

## Bundle / route hygiene

### Lazy-load every feature route

Already required by `angular-routing` skill — `loadComponent` / `loadChildren`. Verify by inspecting `dist/` build output:

```bash
ng build --configuration production
ls -lh dist/web-peso-tugma-ai/browser/*.js
```

You should see multiple chunks. If everything is in `main.js`, lazy loading is broken.

### Bundle analysis

```bash
ng build --configuration production --stats-json
npx source-map-explorer dist/web-peso-tugma-ai/browser/main-*.js
# or
npx webpack-bundle-analyzer dist/web-peso-tugma-ai/browser/stats.json
```

Common bloat sources:
- Importing all of Lodash (`import _ from 'lodash'`) instead of `import debounce from 'lodash/debounce'`. Better: drop Lodash entirely — modern JS covers most of it.
- `moment.js` — replace with `date-fns` or `Intl.DateTimeFormat`.
- RxJS deep imports vs top-level — prefer `import { map } from 'rxjs'` (modern RxJS is tree-shakable from the top-level export).
- Material modules: import individual components, not whole modules.

### `budgets` in `angular.json`

Set realistic budgets and treat warnings as errors:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "800kB" },
  { "type": "anyComponentStyle", "maximumWarning": "8kB", "maximumError": "16kB" }
]
```

## Network / data

### `resource()` / `rxResource()` over manual `subscribe`

Already covered in `rxjs-signals`. The resource API auto-cancels in-flight requests when params change — prevents stale-response bugs and wasted bandwidth.

### HTTP cache headers + service worker

Angular's `provideServiceWorker()` (`ng add @angular/pwa`) gets you offline + cache-first for static assets. Worth it for any installable app.

### Avoid waterfalls

If route A needs data X and Y, fetch them in parallel:

```ts
readonly data = resource({
  loader: async () => {
    const [x, y] = await Promise.all([fetchX(), fetchY()]);
    return { x, y };
  },
});
```

## Profiling

### Angular DevTools

1. Install the Angular DevTools browser extension.
2. **Profiler** tab → Record → interact → Stop.
3. Look for:
   - Components that re-render but shouldn't (signal dependency leak)
   - Long CD ticks (>16ms — frame budget)
   - High tick count (in zoneful mode often points to overzealous events)

### Chrome Performance tab

- Record a representative interaction.
- Check "Total Blocking Time" — anything over 200ms on the main thread is bad.
- "Long tasks" rectangles point to scripts that need splitting (consider `@defer` or breaking up work).

### Lighthouse

```bash
npx lighthouse http://localhost:4200 --view
```

Target scores: **Performance ≥ 90, Accessibility 100, Best Practices ≥ 95**.

## Common pitfalls

| Symptom                            | Likely cause                                                     |
| ---------------------------------- | ---------------------------------------------------------------- |
| Whole list re-renders on every add | `track $index` instead of `track item.id`                        |
| Component re-renders on unrelated state | A signal read leaked into a `computed`/`effect` somewhere    |
| Initial bundle > 1MB               | A feature isn't lazy-loaded, or a giant lib is in `main`         |
| LCP > 2.5s                         | Hero image missing `priority`, font blocking render              |
| Janky scroll                       | Layout-trigger CSS animation, or large list without virtualization |
| Long input-to-paint delay          | Synchronous work in an event handler — defer with `queueMicrotask` or `requestIdleCallback` |

## Anti-patterns to flag

- ❌ Function calls in templates that aren't `computed()`-hoisted
- ❌ `track $index` for entity lists
- ❌ Heavy widgets without `@defer`
- ❌ Whole `lodash`/`moment` imports
- ❌ `priority` on every image (defeats the purpose)
- ❌ Disabling OnPush "because CD isn't running"
- ❌ Polling intervals running on hidden tabs (use `document.visibilityState`)
- ❌ Re-fetching identical data per route navigation — use a store signal or `resource()` with stable params
