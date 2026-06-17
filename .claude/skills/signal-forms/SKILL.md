---
name: signal-forms
description: Angular Signal Forms patterns — fully signal-based forms with schema validators, async validation, Material integration via the [control] directive, and dynamic FieldPath/applyEach. Use when building or modifying any form in this project.
---

# Signal Forms

This project uses **Angular Signal Forms** (`@angular/forms/signals`) exclusively. Do NOT use Reactive Forms (`FormGroup`/`FormBuilder`/`formControlName`) or Template-driven forms (`[(ngModel)]`).

Signal Forms make the underlying data signal the source of truth. Validation, state, and async checks are pure signal derivations — no `valueChanges` observable, no manual `toSignal` interop, no `markAllAsTouched` boilerplate.

## Imports & setup

```ts
import {
  form, schema, apply, applyEach,
  required, email, min, max, minLength, maxLength, pattern,
  validate, validateAsync,
  Control,
} from '@angular/forms/signals';

@Component({
  imports: [Control, /* MatFormFieldModule, MatInputModule, … */],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanFormComponent { /* … */ }
```

The `Control` directive is what wires Material/native inputs to a Signal Forms field. Import it where used.

## Defining a form

The form is built from a writable signal holding the data. The second argument is a schema function that declares validators against the field tree.

```ts
type LoanData = {
  amount: number;
  termMonths: number;
  email: string;
};

@Component({ /* … */ })
export class LoanFormComponent {
  private readonly api = inject(LoansService);

  // 1. Source-of-truth data signal
  private readonly data = signal<LoanData>({ amount: 0, termMonths: 12, email: '' });

  // 2. Form bound to the data signal
  readonly loanForm = form(this.data, (p) => {
    required(p.amount, { message: 'Amount is required' });
    min(p.amount, 1000, { message: 'Minimum loan is ₱1,000' });
    max(p.amount, 1_000_000, { message: 'Maximum loan is ₱1,000,000' });

    required(p.termMonths);
    min(p.termMonths, 1);

    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email' });
  });

  // 3. Derived state — already signals
  readonly valid = computed(() => this.loanForm().valid());
  readonly submitting = signal(false);
}
```

Notes:
- `p` is a typed **FieldPath** mirroring `LoanData`. `p.email` refers to the email field — no magic strings.
- Mutating `this.data.set(...)` updates the form. Mutating field values via the form (`this.loanForm.email().value.set(...)`) updates the data signal. They're two views of one source.

## Reading form state

Every piece of state is a signal — read it as a function call.

```ts
this.loanForm().value()        // current full value
this.loanForm().valid()        // overall valid
this.loanForm().touched()      // any field touched
this.loanForm().dirty()        // any field changed from initial
this.loanForm().errors()       // form-level errors (cross-field)

this.loanForm.email().value()      // field value
this.loanForm.email().valid()      // field valid
this.loanForm.email().touched()    // field touched
this.loanForm.email().dirty()
this.loanForm.email().errors()     // ValidationError[] for this field
this.loanForm.email().disabled()
this.loanForm.email().pending()    // true while async validators are in flight
```

Use directly in `computed()`:

```ts
readonly canSubmit = computed(() =>
  this.loanForm().valid() && !this.submitting()
);

readonly emailErrorMessage = computed(() => {
  const f = this.loanForm.email();
  if (!f.touched() || f.valid()) return null;
  return f.errors()[0]?.message ?? 'Invalid email';
});
```

## Template — the `[control]` directive

`[control]` replaces `formControlName`. It wires the input's value/disabled/blur/focus to the underlying Signal Forms field. Works with Material inputs.

```html
<form (submit)="submit($event)">
  <mat-form-field>
    <mat-label>Loan amount</mat-label>
    <input matInput type="number" [control]="loanForm.amount" />
    @if (amountErrorMessage(); as msg) {
      <mat-error>{{ msg }}</mat-error>
    }
  </mat-form-field>

  <mat-form-field>
    <mat-label>Email</mat-label>
    <input matInput type="email" [control]="loanForm.email" />
    @if (emailErrorMessage(); as msg) {
      <mat-error>{{ msg }}</mat-error>
    }
  </mat-form-field>

  <button mat-raised-button color="primary" type="submit" [disabled]="!canSubmit()">
    Submit
  </button>
</form>
```

Bind to the **field reference**, not its value: `[control]="loanForm.email"` — not `[control]="loanForm.email()"`.

## Submission

```ts
async submit(event: Event) {
  event.preventDefault();

  // Mark everything touched so errors show on first submit attempt
  this.loanForm().markAsTouched();

  if (!this.loanForm().valid()) return;

  this.submitting.set(true);
  try {
    const payload = this.loanForm().value();  // fully typed LoanData
    await firstValueFrom(this.api.save(payload));
  } finally {
    this.submitting.set(false);
  }
}
```

`markAsTouched()` on the root recurses into children. Material's `mat-error` only shows when the field is `touched()`.

## Custom validators

`validate()` is sync and returns `ValidationError | ValidationError[] | null`.

```ts
readonly loanForm = form(this.data, (p) => {
  validate(p.amount, ({ value }) => {
    return value() % 100 === 0
      ? null
      : { kind: 'multiple-of-100', message: 'Must be a multiple of 100' };
  });
});
```

A validator callback receives a context with `value()` (signal), `path`, and `valueOf(otherFieldPath)` for cross-field reads.

## Cross-field validation

Use `valueOf` to read another field inside a validator. Apply at the parent (group) path.

```ts
type Passwords = { password: string; confirm: string };

readonly form = form(signal<Passwords>({ password: '', confirm: '' }), (p) => {
  required(p.password);
  minLength(p.password, 8);
  required(p.confirm);

  validate(p, ({ value }) => {
    const v = value();
    return v.password === v.confirm
      ? null
      : { kind: 'mismatch', message: 'Passwords do not match' };
  });
});
```

The mismatch error lands on the form root, not on either individual field. Display via `form().errors()`.

## Async validators

`validateAsync` accepts an Observable or Promise returning `ValidationError[] | null`. It debounces and cancels naturally — when params change the previous request is dropped.

```ts
readonly loanForm = form(this.data, (p) => {
  required(p.email);
  email(p.email);
  validateAsync(p.email, ({ value }) => {
    return this.api.checkEmail(value()).pipe(
      map(taken =>
        taken ? { kind: 'email-taken', message: 'This email is already registered' } : null
      ),
      catchError(() => of(null)),
    );
  });
});
```

While async validation runs, `field.pending()` is `true`. Use it to show a spinner:

```html
@if (loanForm.email().pending()) { <mat-spinner diameter="16" /> }
```

## Reusable schemas

Extract validation rules into a `schema()` so they can be composed and reused.

```ts
import { schema } from '@angular/forms/signals';

const loanSchema = schema<LoanData>((p) => {
  required(p.amount);
  min(p.amount, 1000);
  required(p.email);
  email(p.email);
});

// Use directly
readonly loanForm = form(this.data, loanSchema);

// Or extend via apply()
readonly loanForm = form(this.data, (p) => {
  apply(p, loanSchema);
  validate(p.amount, ({ value }) => /* extra rule */ null);
});
```

Schemas are pure (no DI) — perfect for sharing between component, server-side validation, and tests.

## Dynamic / array fields with `applyEach`

For array fields, define validators once and apply to every item.

```ts
type Beneficiary = { name: string; share: number };

readonly data = signal<{ beneficiaries: Beneficiary[] }>({ beneficiaries: [] });

readonly form = form(this.data, (p) => {
  applyEach(p.beneficiaries, (b) => {
    required(b.name);
    minLength(b.name, 2);
    min(b.share, 0);
    max(b.share, 100);
  });

  // Cross-field: shares sum to 100
  validate(p.beneficiaries, ({ value }) => {
    const total = value().reduce((s, x) => s + x.share, 0);
    return total === 100 ? null : { kind: 'sum', message: 'Shares must total 100%' };
  });
});

add() {
  this.data.update(d => ({ ...d, beneficiaries: [...d.beneficiaries, { name: '', share: 0 }] }));
}
remove(i: number) {
  this.data.update(d => ({ ...d, beneficiaries: d.beneficiaries.filter((_, j) => j !== i) }));
}
```

Template:

```html
@for (b of form.beneficiaries(); track $index) {
  <div>
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput [control]="form.beneficiaries[$index].name" />
    </mat-form-field>
    <mat-form-field>
      <mat-label>Share (%)</mat-label>
      <input matInput type="number" [control]="form.beneficiaries[$index].share" />
    </mat-form-field>
    <button mat-icon-button type="button" (click)="remove($index)" aria-label="Remove beneficiary">
      <mat-icon>delete</mat-icon>
    </button>
  </div>
}
<button mat-stroked-button type="button" (click)="add()">Add beneficiary</button>
```

## Conditional disabling / hiding

Set a field disabled via the form API (no special syntax needed in the schema):

```ts
constructor() {
  effect(() => {
    const disabled = this.loanForm.amount().value() < 5000;
    this.loanForm.termMonths().disabled.set(disabled);
  });
}
```

## Initial values & reset

Update the source signal to reset:

```ts
private readonly initial: LoanData = { amount: 0, termMonths: 12, email: '' };

reset() {
  this.data.set(this.initial);
  this.loanForm().markAsPristine();
  this.loanForm().markAsUntouched();
}
```

## Migration recipes (Reactive → Signal)

| Reactive Forms                              | Signal Forms                                       |
| ------------------------------------------- | -------------------------------------------------- |
| `fb.group({ email: fb.control('', [Validators.required, Validators.email]) })` | `form(signal({ email: '' }), p => { required(p.email); email(p.email); })` |
| `form.controls.email`                       | `form.email`                                       |
| `form.controls.email.value`                 | `form.email().value()`                             |
| `form.controls.email.valid`                 | `form.email().valid()`                             |
| `form.controls.email.errors`                | `form.email().errors()`                            |
| `form.valueChanges` + `toSignal()`          | `form().value()` (already a signal)                |
| `form.statusChanges` + `toSignal()`         | `form().valid()` / `form().pending()`              |
| `formControlName="email"`                   | `[control]="form.email"`                           |
| `Validators.required`                       | `required(p.email)`                                |
| `AsyncValidatorFn`                          | `validateAsync(p.email, ({ value }) => …)`         |
| `FormArray`                                 | Array field + `applyEach(p.items, item => …)`      |
| `form.markAllAsTouched()`                   | `form().markAsTouched()`                           |
| `form.getRawValue()`                        | `form().value()`                                   |
| `form.reset()`                              | `data.set(initial); form().markAsPristine()`       |

## Anti-patterns to flag

- ❌ `FormBuilder` / `FormGroup` / `FormControl` / `FormArray` — replace with `form()` + signal data
- ❌ `formControlName` / `[formGroup]` / `formGroupName` — replace with `[control]`
- ❌ `[(ngModel)]` for app state
- ❌ `.subscribe()` on `valueChanges` / `statusChanges` — the form *is* a signal tree
- ❌ `toSignal(form.valueChanges)` — redundant; `form().value()` already is one
- ❌ Reading `form().value()` and writing it back via setters — mutate the source `signal()` instead
- ❌ Validators called outside the schema callback (`required(p.email)` outside `form(data, p => { … })`)
- ❌ Validators that close over component instance state and aren't pure — extract to a `schema()` and pass dependencies as args
- ❌ `[control]="form.email()"` — bind the field reference, not its value
- ❌ Manually re-implementing async cancellation — `validateAsync` already handles it

## Resources

- `@angular/forms/signals` API docs (the live source of truth for the field/validator APIs).
- The `apply()` / `applyEach()` / `schema()` helpers compose — use them to keep validation logic DRY across forms.
