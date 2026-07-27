import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { meEvents } from '../../../stores/me/me.events';
import { MeStore } from '../../../stores/me/me.store';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Change password</h2>

    <form (submit)="submit($event)">
      <mat-dialog-content class="dialog__content">
        <p class="dialog__hint">
          Enter your current password, then choose a new one to keep your account protected.
        </p>

        @if (serverError(); as msg) {
          <p class="dialog__alert" role="alert">
            <mat-icon aria-hidden="true">error_outline</mat-icon>
            <span>{{ msg }}</span>
          </p>
        }

        <mat-form-field appearance="outline">
          <mat-label>Current password</mat-label>
          <input
            matInput
            [type]="showCurrent() ? 'text' : 'password'"
            autocomplete="current-password"
            [formField]="passwordForm.currentPassword"
          />
          <button
            matIconButton
            type="button"
            matSuffix
            [attr.aria-label]="showCurrent() ? 'Hide password' : 'Show password'"
            [attr.aria-pressed]="showCurrent()"
            (click)="toggleCurrent()"
          >
            <mat-icon>{{ showCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (currentPasswordError(); as msg) {
            <mat-error>{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>New password</mat-label>
          <input
            matInput
            [type]="showNew() ? 'text' : 'password'"
            autocomplete="new-password"
            [formField]="passwordForm.newPassword"
          />
          <button
            matIconButton
            type="button"
            matSuffix
            [attr.aria-label]="showNew() ? 'Hide password' : 'Show password'"
            [attr.aria-pressed]="showNew()"
            (click)="toggleNew()"
          >
            <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (newPasswordError(); as msg) {
            <mat-error>{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Confirm password</mat-label>
          <input
            matInput
            [type]="showConfirm() ? 'text' : 'password'"
            autocomplete="new-password"
            [formField]="passwordForm.confirmPassword"
          />
          <button
            matIconButton
            type="button"
            matSuffix
            [attr.aria-label]="showConfirm() ? 'Hide password' : 'Show password'"
            [attr.aria-pressed]="showConfirm()"
            (click)="toggleConfirm()"
          >
            <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (confirmPasswordError(); as msg) {
            <mat-error>{{ msg }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button matButton type="button" [disabled]="store.saving()" (click)="cancel()">
          Cancel
        </button>
        <button matButton="tonal" type="submit" [disabled]="store.saving()">Update password</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .dialog__content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: min(24rem, 80vw);
    }

    .dialog__hint {
      margin: 0 0 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
    }

    .dialog__alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.625rem;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      font-size: 0.875rem;

      mat-icon {
        flex-shrink: 0;
        font-size: 1.125rem;
        width: 1.125rem;
        height: 1.125rem;
      }
    }

    mat-form-field {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  protected readonly store = inject(MeStore);
  private readonly dispatch = injectDispatch(meEvents);
  private readonly events = inject(Events);
  private readonly dialogRef = inject<MatDialogRef<ChangePasswordDialogComponent>>(MatDialogRef);

  protected readonly showCurrent = signal(false);
  protected readonly showNew = signal(false);
  protected readonly showConfirm = signal(false);

  // Server-side rejection (e.g. wrong current password) shown as an alert.
  protected readonly serverError = signal<string | null>(null);

  private readonly passwordData = signal<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(this.passwordData, (p) => {
    required(p.currentPassword, { message: 'Current password is required' });
    required(p.newPassword, { message: 'New password is required' });
    minLength(p.newPassword, 8, { message: 'Password must be at least 8 characters' });
    maxLength(p.newPassword, 128, { message: 'Password must be 128 characters or fewer' });
    required(p.confirmPassword, { message: 'Please confirm the password' });
    validate(p.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(p.newPassword)
        ? null
        : { kind: 'password-mismatch', message: 'Passwords do not match' },
    );
  });

  protected readonly currentPasswordError = computed(() =>
    this.fieldError(this.passwordForm.currentPassword()),
  );
  protected readonly newPasswordError = computed(() =>
    this.fieldError(this.passwordForm.newPassword()),
  );
  protected readonly confirmPasswordError = computed(() =>
    this.fieldError(this.passwordForm.confirmPassword()),
  );

  protected toggleCurrent(): void {
    this.showCurrent.update((value) => !value);
  }

  protected toggleNew(): void {
    this.showNew.update((value) => !value);
  }

  protected toggleConfirm(): void {
    this.showConfirm.update((value) => !value);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.passwordForm().markAsTouched();
    if (!this.passwordForm().valid() || this.store.saving()) {
      return;
    }
    const value = this.passwordForm().value();
    this.dispatch.updateMe({
      data: {
        current_password: value.currentPassword,
        password: value.newPassword,
      },
      message: 'Password updated',
    });
  }

  // Close the dialog once the store confirms the update succeeded.
  #onSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close(true))))(
    this.events.on(meEvents.updateMeSuccess),
  );

  // Surface a rejected update (e.g. wrong current password) inline; the dialog
  // stays open so the user can correct and retry.
  #onFailure = rxMethod<{ payload: string }>(
    pipe(tap(({ payload }) => this.serverError.set(payload))),
  )(this.events.on(meEvents.updateMeFailed));

  private fieldError(field: {
    touched: () => boolean;
    valid: () => boolean;
    errors: () => ReadonlyArray<{ message?: string }>;
  }): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }
}
