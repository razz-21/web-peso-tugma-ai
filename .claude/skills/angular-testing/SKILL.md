---
name: angular-testing
description: Testing patterns for signals-first Angular components and services. Use when adding/changing tests — covers Jasmine/Karma setup, TestBed config, testing signals & computed, fakeAsync for effects, Material component test harnesses, and HTTP mocking.
---

# Angular Testing (signals-aware)

This project uses the default Angular CLI test runner (Jasmine + Karma). Tests live alongside source (`*.spec.ts`).

## Running tests

```bash
ng test                       # watch mode (Karma launches browser)
ng test --watch=false         # single run
ng test --code-coverage       # generate coverage/
ng test --browsers=ChromeHeadless --watch=false   # CI
```

## TestBed setup (standalone)

For standalone components, declare them under `imports` (not `declarations`).

```ts
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [LoanFormComponent, NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: LoansService, useValue: jasmine.createSpyObj('LoansService', ['save', 'getById']) },
    ],
  }).compileComponents();
});
```

`NoopAnimationsModule` disables animations during tests (faster, deterministic).

## Reading signals in tests

Signals are functions — call them. `fixture.detectChanges()` runs CD which evaluates `computed` and pushes signal reads through templates.

```ts
it('doubles the count', () => {
  const fixture = TestBed.createComponent(CounterComponent);
  const cmp = fixture.componentInstance;

  cmp.count.set(3);
  fixture.detectChanges();

  expect(cmp.doubled()).toBe(6);
  expect(fixture.nativeElement.textContent).toContain('6');
});
```

### Testing a `computed()` in isolation

`computed()` requires an injection context. Wrap with `TestBed.runInInjectionContext`:

```ts
it('total computes from items', () => {
  TestBed.runInInjectionContext(() => {
    const items = signal([{ price: 10 }, { price: 20 }]);
    const total = computed(() => items().reduce((s, i) => s + i.price, 0));

    expect(total()).toBe(30);
    items.update(xs => [...xs, { price: 5 }]);
    expect(total()).toBe(35);
  });
});
```

### Testing `effect()`

`effect()` runs asynchronously (via scheduler). Use `fakeAsync` + `tick()` or `flush()` to drive it.

```ts
import { fakeAsync, flush } from '@angular/core/testing';

it('persists theme to localStorage', fakeAsync(() => {
  const svc = TestBed.inject(ThemeService);
  spyOn(localStorage, 'setItem');

  svc.set('dark');
  TestBed.tick(); // or flushEffects() via flush()
  flush();

  expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
}));
```

For sync flushing in non-fakeAsync tests, call `TestBed.flushEffects()` (Angular 18+) or `TestBed.tick()` (Angular 19+).

## Testing signal-based inputs

`input()`/`input.required()` signals are set via `componentRef.setInput(name, value)`. Don't try to assign directly — they're read-only on the instance.

```ts
it('shows the loan id', () => {
  const fixture = TestBed.createComponent(LoanDetailComponent);
  fixture.componentRef.setInput('id', '42');
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent).toContain('Loan #42');
});
```

For `model()` (two-way): also use `setInput`. Read changes via `componentInstance.someModel()` or subscribe to `someModel` if needed.

## Testing outputs

`output()` exposes an EventEmitter-like API. Subscribe in tests.

```ts
it('emits saved on submit', () => {
  const fixture = TestBed.createComponent(LoanFormComponent);
  const cmp = fixture.componentInstance;
  const spy = jasmine.createSpy('saved');
  cmp.saved.subscribe(spy);

  cmp.submit();

  expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ amount: 0 }));
});
```

## Material component test harnesses

Use `@angular/material/<component>/testing` instead of querying the DOM. Harnesses are stable across Material versions.

```ts
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

let loader: HarnessLoader;

beforeEach(() => {
  const fixture = TestBed.createComponent(LoanFormComponent);
  fixture.detectChanges();
  loader = TestbedHarnessEnvironment.loader(fixture);
});

it('submits when form is valid', async () => {
  const email = await loader.getHarness(MatInputHarness.with({ selector: '[formControlName=email]' }));
  await email.setValue('a@b.com');

  const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  expect(await submit.isDisabled()).toBe(false);
  await submit.click();
});
```

Available harnesses for everything: `MatSelectHarness`, `MatDialogHarness`, `MatTableHarness`, `MatCheckboxHarness`, etc. Find them at `@angular/material/<component>/testing`.

## Testing Signal Forms

Mutate the source data signal (or the field directly), call `detectChanges()`, then assert on signal-returned state. No `valueChanges` subscriptions needed.

```ts
it('marks email as required', () => {
  const fixture = TestBed.createComponent(LoanFormComponent);
  const cmp = fixture.componentInstance;

  // mutate the source data signal exposed for testing, or call setter
  cmp.loanForm.email().value.set('');
  cmp.loanForm.email().markAsTouched();
  fixture.detectChanges();

  const errors = cmp.loanForm.email().errors();
  expect(errors.some(e => e.kind === 'required')).toBe(true);
  expect(cmp.emailErrorMessage()).toBe('Email is required');
});

it('runs async validator and reports email-taken', fakeAsync(() => {
  const api = TestBed.inject(LoansService) as jasmine.SpyObj<LoansService>;
  api.checkEmail.and.returnValue(of(true));

  const fixture = TestBed.createComponent(LoanFormComponent);
  const cmp = fixture.componentInstance;

  cmp.loanForm.email().value.set('taken@example.com');
  cmp.loanForm.email().markAsTouched();
  fixture.detectChanges();
  flush(); // resolve async validator
  fixture.detectChanges();

  expect(cmp.loanForm.email().errors().some(e => e.kind === 'email-taken')).toBe(true);
}));
```

See the `signal-forms` skill for the full form API. Reactive Forms (`FormGroup`/`formControlName`) are not used in this project.

## Testing services

For simple services, instantiate via `TestBed.inject`. Mock dependencies with `useValue` providers.

```ts
describe('CartStore', () => {
  let store: CartStore;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
  });

  it('adds items and updates total', () => {
    store.add({ price: 100 });
    store.add({ price: 50 });
    expect(store.items()).toHaveSize(2);
    expect(store.total()).toBe(150);
  });
});
```

## HTTP testing

Use `provideHttpClient()` + `provideHttpClientTesting()`, then assert with `HttpTestingController`.

```ts
let httpMock: HttpTestingController;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), LoansService],
  });
  httpMock = TestBed.inject(HttpTestingController);
});

afterEach(() => httpMock.verify());

it('GETs the loan by id', () => {
  const svc = TestBed.inject(LoansService);
  let result: Loan | undefined;
  svc.getById('42').subscribe(l => (result = l));

  const req = httpMock.expectOne('/api/loans/42');
  expect(req.request.method).toBe('GET');
  req.flush({ id: '42', amount: 1000 });

  expect(result?.amount).toBe(1000);
});
```

## Testing `resource()` / `rxResource()`

`resource()` runs its loader asynchronously. Use `fakeAsync` + flush, then read `value()` / `status()`.

```ts
it('loads the loan', fakeAsync(() => {
  const fixture = TestBed.createComponent(LoanDetailComponent);
  fixture.componentRef.setInput('id', '42');
  fixture.detectChanges();

  const req = httpMock.expectOne('/api/loans/42');
  req.flush({ id: '42', amount: 1000 });
  flush();
  fixture.detectChanges();

  expect(fixture.componentInstance.loan.value()?.amount).toBe(1000);
}));
```

## Testing route-driven components

Provide a stub `ActivatedRoute` or use `RouterTestingHarness` for full route resolution.

```ts
import { RouterTestingHarness } from '@angular/router/testing';

it('renders the loan id from route', async () => {
  await TestBed.configureTestingModule({
    imports: [LoanDetailComponent],
    providers: [provideRouter([{ path: 'loans/:id', component: LoanDetailComponent }])],
  }).compileComponents();

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/loans/42');

  const cmp = harness.routeNativeElement!;
  expect(cmp.textContent).toContain('42');
});
```

## Style and structure

- One `describe` per public unit. Nest with sub-`describe` for state variations.
- Test names: `'<does what> when <state>'` — e.g. `'disables submit when form is invalid'`.
- Arrange / Act / Assert blocks with blank lines between them.
- Prefer harnesses over `By.css(...)`. Harnesses are stable; CSS selectors break on minor template changes.

## What to test

- **Public behavior**, not implementation. If a refactor preserves behavior, tests should still pass.
- Signals: state transitions, derived values, effect side-effects.
- Form components: validation, error display, disabled states, submit flow.
- Route components: routing inputs, guards, resolvers.
- Services: state mutations, derived state, HTTP interactions.

Skip:
- Private methods directly (tested indirectly via public methods).
- Library code (Angular, Material, RxJS — already tested upstream).
- One-line getters/setters.

## Anti-patterns to flag

- ❌ `(cmp as any).privateField = …` — test via the public API
- ❌ Setting `(cmp as any).inputProp = …` instead of `componentRef.setInput(...)`
- ❌ Skipping `detectChanges()` after mutating state and asserting on DOM
- ❌ Not calling `httpMock.verify()` in `afterEach`
- ❌ Querying DOM with `By.css` when a harness exists
- ❌ Tests that depend on order (use `beforeEach` properly)
- ❌ Stubbing the unit under test (you're testing the stub, not the unit)
- ❌ Running real timers when `fakeAsync` would do
- ❌ Snapshot tests of large DOM trees (brittle, low signal)
