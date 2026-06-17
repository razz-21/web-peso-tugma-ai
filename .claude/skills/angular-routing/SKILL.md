---
name: angular-routing
description: Angular standalone routing with lazy loading, functional guards/resolvers, and signal-based route state. Use when adding routes, splitting feature areas, protecting routes, or reading route params/data from components.
---

# Angular Routing (standalone + signals)

This project uses standalone components, `provideRouter`, lazy-loaded feature routes, and reads route state via signals.

## App-level setup

`main.ts` / `app.config.ts`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(), // route params → component inputs
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
  ],
};
```

`withComponentInputBinding()` is the key enabler — it lets route params/data flow into `input()` signals on components.

## Lazy loading is mandatory for feature areas

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'loans',
    loadChildren: () => import('./features/loans/loans.routes').then(m => m.LOAN_ROUTES),
    canMatch: [authMatchGuard],
  },
  { path: '**', loadComponent: () => import('./shared/not-found.component').then(m => m.NotFoundComponent) },
];
```

Use `loadComponent` for a single route, `loadChildren` for a feature area with its own internal routes.

## Route params via signal inputs

With `withComponentInputBinding()` enabled, just declare `input()` matching the param/data name. No `ActivatedRoute` subscription needed.

```ts
// Route: { path: 'loans/:id', component: LoanDetailComponent, data: { breadcrumb: 'Loan' } }

@Component({ /* … */ })
export class LoanDetailComponent {
  // Maps from path param :id
  readonly id = input.required<string>();
  // Maps from route data
  readonly breadcrumb = input.required<string>();

  // Derived
  readonly loanId = computed(() => Number(this.id()));
}
```

## When you need ActivatedRoute (e.g. query params)

Wrap once with `toSignal()` so the rest of the component stays signal-based.

```ts
private readonly route = inject(ActivatedRoute);

readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
readonly page = computed(() => Number(this.queryParams().get('page') ?? 1));
readonly sort = computed(() => this.queryParams().get('sort') ?? 'desc');
```

Never `.subscribe()` to `route.params`/`queryParams` in a component — convert to a signal.

## Functional guards (the only kind to use)

Class-based guards are deprecated. Use functions.

```ts
// auth.guards.ts
export const authMatchGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.parseUrl('/login');
};

export const authActivateGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.parseUrl(`/login?next=${encodeURIComponent(state.url)}`);
};
```

Guard placement guidance:

- **`canMatch`** for lazy routes when the guard decision is stable (auth, feature flags). It runs *before* the bundle loads — failing here skips the lazy chunk download entirely.
- **`canActivate`** when the decision depends on route data, or for non-lazy routes.
- **`canDeactivate`** for "discard unsaved changes?" prompts. Return `boolean | Observable<boolean>`.

`AuthService.isAuthenticated()` should be a signal getter so guards work synchronously where possible.

## Functional resolvers (with signals/resource)

Prefer doing data loading inside the component via `resource()` / `rxResource()` over resolvers. Use a resolver only when the route should not activate until the data is in hand (e.g., title needs the data).

```ts
export const loanResolver: ResolveFn<Loan> = (route) => {
  const api = inject(LoansService);
  return api.getById(route.paramMap.get('id')!);
};

// Route
{ path: 'loans/:id', component: LoanDetailComponent, resolve: { loan: loanResolver } }

// Component reads resolved data as an input (componentInputBinding)
readonly loan = input.required<Loan>();
```

## Functional interceptors

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token(); // signal read
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
```

Register via `provideHttpClient(withInterceptors([authInterceptor]))`.

## Navigation

Inject `Router`. Prefer `router.navigate(['/path'], { queryParams, replaceUrl })` for absolute routes and `routerLink` in templates.

```html
<a [routerLink]="['/loans', id()]" [queryParams]="{ tab: 'history' }" routerLinkActive="active">
  View loan
</a>
```

## Feature route file convention

Each feature owns its own routes file:

```
src/app/features/loans/
  loans.routes.ts        // exports LOAN_ROUTES
  loan-list.component.ts
  loan-detail.component.ts
  loans.service.ts
```

```ts
// loans.routes.ts
export const LOAN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./loan-list.component').then(m => m.LoanListComponent) },
  { path: ':id', loadComponent: () => import('./loan-detail.component').then(m => m.LoanDetailComponent) },
];
```

## Anti-patterns to flag

- ❌ `RouterModule.forRoot(...)` — use `provideRouter(...)`
- ❌ Class-based `CanActivate`/`Resolve` — use functional `*Fn` versions
- ❌ Eagerly importing a feature component in `app.routes.ts` instead of `loadComponent`
- ❌ `.subscribe()` to `route.params`/`queryParams` — use signal inputs or `toSignal()`
- ❌ `(click)="goSomewhere()"` that just calls `router.navigate(...)` instead of `routerLink`
- ❌ Auth checks done inside `ngOnInit` instead of a guard
- ❌ Resolvers that block the route for data the component could lazily fetch
