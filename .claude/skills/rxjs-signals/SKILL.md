---
name: rxjs-signals
description: RxJS ↔ Signals interop guide for this signals-first codebase. Use when bridging async sources (HTTP, route params, websockets) to signals, choosing between signals vs observables, or migrating .subscribe() / async-pipe code to toSignal / resource / rxResource.
---

# RxJS ↔ Signals interop

This project is signals-first. Use observables only where they materially win (multicast streams, time-based operators, complex async flows). Convert at the boundary.

## Decision rule

| Source                              | Use            |
| ----------------------------------- | -------------- |
| Local UI state                      | `signal()`     |
| Derived state                       | `computed()`   |
| One HTTP request tied to inputs     | `resource()`   |
| One HTTP request returning Observable | `rxResource()` |
| Route params/data                   | signal `input()` (with `withComponentInputBinding()`) or `toSignal(route.paramMap)` |
| Form state                          | Signal Forms (`form()` — already signal-native, no interop needed). See `signal-forms` skill. |
| WebSocket / SSE / interval streams  | Observable + `toSignal()` at consumption site |
| Event bus / multicast               | `Subject` / `BehaviorSubject` |
| Side effects                        | `effect()` (not subscribe) |

Default to signals. Reach for RxJS when you actually need its operators (`debounceTime`, `switchMap`, `combineLatest`, etc.).

## Converting Observable → Signal

`toSignal()` reads an observable into a signal. The signal value updates as the observable emits.

```ts
import { toSignal } from '@angular/core/rxjs-interop';

// With initial value (preferred — no |undefined in the signal type)
readonly user = toSignal(this.userService.user$, { initialValue: null });

// Without initial value (signal type is T | undefined)
readonly user = toSignal(this.userService.user$);

// requireSync: true — for sources that synchronously emit (BehaviorSubject, ReplaySubject(1))
readonly user = toSignal(this.userService.userBs$, { requireSync: true });
```

`toSignal` auto-cleans up when the injection context is destroyed. Call it in a constructor, field initializer, or `inject()`-aware function.

## Converting Signal → Observable

`toObservable()` reads a signal into an observable. Useful when an RxJS-only API (e.g., older HttpClient pipeline composition) needs the value.

```ts
import { toObservable } from '@angular/core/rxjs-interop';

readonly query = signal('');
readonly results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(250),
    distinctUntilChanged(),
    switchMap(q => q ? this.api.search(q) : of([])),
  ),
  { initialValue: [] as Result[] },
);
```

This is the canonical "debounced search" pattern in a signals codebase: signal → observable for the operator pipeline → signal at the end.

## `resource()` — declarative async fetch

`resource()` is the preferred way to load data driven by reactive params. It returns an object with `value()`, `status()`, `error()`, `isLoading()`, and `reload()`.

```ts
readonly loanId = input.required<string>();

readonly loan = resource({
  params: () => ({ id: this.loanId() }),
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(`/api/loans/${params.id}`, { signal: abortSignal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Loan>;
  },
});
```

Template:

```html
@if (loan.isLoading()) {
  <mat-spinner />
} @else if (loan.error(); as err) {
  <p>Failed: {{ err }}</p>
} @else if (loan.value(); as data) {
  <app-loan-detail [loan]="data" />
}
```

Key properties:
- Re-runs whenever any signal read inside `params` changes.
- Auto-cancels in-flight requests via `abortSignal`.
- `reload()` re-fetches with current params.

## `rxResource()` — `resource()` with an Observable loader

Use when the loader is naturally an Observable (e.g., HttpClient returns one).

```ts
private readonly api = inject(LoansService);

readonly loan = rxResource({
  params: () => ({ id: this.loanId() }),
  stream: ({ params }) => this.api.getById(params.id),
});
```

The `stream` callback returns an Observable. Cancellation is handled via the Observable's unsubscribe semantics.

## Migration recipes

### `.subscribe()` in a component → `toSignal()`

```ts
// Before
data: User | null = null;
sub: Subscription;
ngOnInit() {
  this.sub = this.api.user$.subscribe(u => this.data = u);
}
ngOnDestroy() { this.sub.unsubscribe(); }

// After
readonly data = toSignal(this.api.user$, { initialValue: null });
```

### `async` pipe → signal in template

```html
<!-- Before -->
@if (user$ | async; as user) { <p>{{ user.name }}</p> }

<!-- After (controller: readonly user = toSignal(user$)) -->
@if (user(); as user) { <p>{{ user.name }}</p> }
```

### `combineLatest` for derived state → `computed()`

```ts
// Before
this.total$ = combineLatest([this.items$, this.discount$]).pipe(
  map(([items, d]) => items.reduce((s, i) => s + i.price, 0) * (1 - d)),
);

// After (items and discount are signals)
readonly total = computed(() =>
  this.items().reduce((s, i) => s + i.price, 0) * (1 - this.discount()),
);
```

### `switchMap` chain → `resource()` / `rxResource()`

```ts
// Before
this.loan$ = this.route.paramMap.pipe(
  map(p => p.get('id')!),
  switchMap(id => this.api.getById(id)),
);

// After
readonly id = input.required<string>();
readonly loan = rxResource({
  params: () => ({ id: this.id() }),
  stream: ({ params }) => this.api.getById(params.id),
});
```

## Effects — what they're for (and aren't)

`effect()` runs whenever read signals change. Use for **side effects only**.

```ts
constructor() {
  // ✅ Side effect: logging
  effect(() => console.log('count changed:', this.count()));

  // ✅ Side effect: persistence
  effect(() => localStorage.setItem('theme', this.mode()));

  // ✅ Side effect: DOM measurement
  effect(() => {
    const el = this.box(); // viewChild signal
    if (el) this.size.set(el.nativeElement.getBoundingClientRect());
  });
}
```

**Do not** write to another signal from inside `effect()` to compute derived state — that's what `computed()` and `linkedSignal()` are for. Writing to signals inside `effect()` is allowed only when it's a true side effect (e.g., syncing to a non-Angular source), and you'll usually need `allowSignalWrites: true` (legacy) — prefer to redesign instead.

## Multicast and shared state

If multiple consumers need the same async source, the service holds the Subject/observable. Components convert via `toSignal()` at the boundary.

```ts
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly events$ = webSocket<Event>('/ws/notifications');
  readonly events = toSignal(this.events$.pipe(shareReplay(1)), { initialValue: null });
}
```

## Anti-patterns to flag

- ❌ `.subscribe()` in a component (use `toSignal()`/`resource()`/`async` pipe)
- ❌ `ngOnDestroy` with `takeUntil(destroy$)` boilerplate — `toSignal()` and `takeUntilDestroyed()` (from `@angular/core/rxjs-interop`) replace it
- ❌ `effect()` used to compute derived state — use `computed()`
- ❌ `BehaviorSubject` for component-local state — use `signal()`
- ❌ Manual loading/error booleans around an HTTP call — use `resource()` / `rxResource()`
- ❌ `async` pipe nested twice in a template (`*ngIf="x$ | async as x"` then `(y$ | async)`) — convert both to signals
- ❌ Manual unsubscribe with `takeUntil` when the consumer is a signal already
