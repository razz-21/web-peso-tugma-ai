import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, email, form, maxLength, required } from '@angular/forms/signals';
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

type ProfileForm = {
  fullname: string;
  email: string;
};

@Component({
  selector: 'app-edit-profile-dialog',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrl: './edit-profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileDialogComponent {
  protected readonly store = inject(MeStore);
  private readonly dispatch = injectDispatch(meEvents);
  private readonly events = inject(Events);
  private readonly dialogRef = inject<MatDialogRef<EditProfileDialogComponent>>(MatDialogRef);

  // Server-side rejection (e.g. email already registered) shown as an alert.
  protected readonly serverError = signal<string | null>(null);

  private readonly profileData = signal<ProfileForm>({
    fullname: this.store.user()?.fullname ?? '',
    email: this.store.user()?.email ?? '',
  });

  protected readonly profileForm = form(this.profileData, (p) => {
    required(p.fullname, { message: 'Full name is required' });
    maxLength(p.fullname, 100, { message: 'Full name must be 100 characters or fewer' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
  });

  protected readonly fullnameError = computed(() => this.fieldError(this.profileForm.fullname()));
  protected readonly emailError = computed(() => this.fieldError(this.profileForm.email()));

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.profileForm().markAsTouched();
    if (!this.profileForm().valid() || this.store.saving()) {
      return;
    }
    const value = this.profileForm().value();
    this.dispatch.updateMe({
      data: { fullname: value.fullname.trim(), email: value.email.trim() },
      message: 'Profile updated',
    });
  }

  // Close the dialog once the store confirms the update succeeded.
  #onSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close(true))))(
    this.events.on(meEvents.updateMeSuccess),
  );

  // Surface a rejected update (e.g. duplicate email) inline; the dialog stays
  // open so the user can correct and retry.
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
