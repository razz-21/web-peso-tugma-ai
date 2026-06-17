---
name: angular-best-practices
description: Reviews and enforces Angular v20+ best practices with a signals-first approach. Use when authoring or modifying components, directives, services, or pipes — covers signals, signal-based inputs/outputs/queries, OnPush, standalone, native control flow, and the project's CLAUDE.md rules.
---

# Angular Best Practices (signals-first)

You are reviewing or authoring Angular code in this project. Apply these rules. The project targets Angular v20+ with standalone components by default.

## Components

- **Standalone by default**: do NOT set `standalone: true` — it's the default. Do NOT use NgModules.
- **OnPush always**: every `@Component` decorator must include `changeDetection: ChangeDetectionStrategy.OnPush`. Signals + OnPush is the intended push model.
- **Single responsibility**: keep components small. Split when a component grows multiple concerns.
- **Inline templates** for small components (<~30 lines). For larger templates use external files with paths relative to the component TS.
- **No `@HostBinding`/`@HostListener`** — put host bindings in the `host` object of `@Component`/`@Directive`.

## Signals are the default for state

- `signal<T>(initial)` for writable local state.
- `computed(() => …)` for any derived state. Never recompute manually.
- `linkedSignal({ source, computation })` when you need a writable signal that resets from a derived value.
- `effect(() => …)` only for side effects (DOM measurements, logging, sync to non-Angular). Never to write to other signals — use `computed`/`linkedSignal` instead.
- Use `update`/`set` on signals. **Never** `mutate`.
- `untracked(() => …)` to read a signal inside a `computed`/`effect` without registering a dependency.

```ts
// Good
readonly count = signal(0);
readonly doubled = computed(() => this.count() * 2);
increment() { this.count.update(n => n + 1); }

// Bad — manual derivation, manual mutation
this.doubled = this.count * 2;
this.items.push(x); // mutation on a signal value
```

## Signal-based component API

Replace decorator APIs with their signal equivalents:

| Old (decorator)              | New (signal)                          |
| ---------------------------- | ------------------------------------- |
| `@Input() name!: string`     | `name = input.required<string>()`     |
| `@Input() name = 'x'`        | `name = input<string>('x')`           |
| `@Output() saved = …`        | `saved = output<Payload>()`           |
| `@Input() + @Output() ngModel` | `value = model<string>('')`         |
| `@ViewChild('foo')`          | `foo = viewChild<ElementRef>('foo')`  |
| `@ViewChildren('foo')`       | `foos = viewChildren<ElementRef>('foo')` |
| `@ContentChild(Tab)`         | `tab = contentChild(Tab)`             |

Read inputs/queries as functions in templates and code: `this.name()`, `{{ name() }}`.

## Templates

- **Native control flow only**: `@if`, `@for`, `@switch`. Do NOT use `*ngIf`, `*ngFor`, `*ngSwitch`.
- `@for` always needs `track`: `@for (item of items(); track item.id) { … }`.
- **Class/style bindings**: `[class.foo]="cond()"`, `[style.color]="color()"`. Do NOT use `ngClass`/`ngStyle`.
- **No arrow functions in templates** — they're not supported. Hoist to a `computed()` or method.
- **No globals** (`new Date()`, etc.) — expose via a signal or pipe.
- Use the `async` pipe for any leftover observables. Prefer converting to signals via `toSignal()`.
- Images: `NgOptimizedImage` for static images (does not work for inline base64).

## Services

- Single responsibility per service.
- `@Injectable({ providedIn: 'root' })` for singletons.
- Use `inject(Foo)` inside the class body. Do NOT use constructor parameter injection.

```ts
@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly http = inject(HttpClient);
}
```

## State exposure pattern

Expose `readonly` signals from services/stores. Mutate via methods.

```ts
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((s, i) => s + i.price, 0));

  add(item: Item) { this._items.update(xs => [...xs, item]); }
}
```

## TypeScript rules

- Strict mode. No `any` — use `unknown` when uncertain and narrow.
- Prefer type inference when the type is obvious.
- Use `readonly` aggressively on class fields that aren't reassigned.

## Review checklist (run mentally on every change)

1. Standalone? (default — no `standalone: true` set)
2. `changeDetection: OnPush` on the component?
3. All state in `signal()` / `computed()`?
4. `input()`/`output()`/`model()`/`viewChild()` instead of decorators?
5. `@if`/`@for`/`@switch` (with `track`) instead of `*ngIf`/`*ngFor`?
6. No `ngClass`/`ngStyle`/`@HostBinding`/`mutate`?
7. `inject()` used for DI?
8. No arrow functions in templates?
9. Any `.subscribe()` — could it be `toSignal()` or `async` pipe instead?
10. Any form using `FormGroup`/`formControlName` — should be Signal Forms (`form()` + `[control]`) instead. See `signal-forms` skill.
