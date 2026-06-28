import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import {
  ROLE_LABELS,
  USER_ROLES,
  UserPost,
  UserGet,
  UserRole,
} from '../../../core/models/user.model';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { usersEvents } from '../../../stores/users/users.events';
import { UsersStore } from '../../../stores/users/users.store';

type UserFormValue = {
  fullname: string;
  email: string;
  role: '' | UserRole;
  password: string;
  confirmPassword: string;
};

const INITIAL_VALUE: UserFormValue = {
  fullname: '',
  email: '',
  role: 'admin',
  password: '',
  confirmPassword: '',
};

@Component({
  selector: 'app-user-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormField,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  private readonly dispatch = injectDispatch(usersEvents);
  private readonly dialogRef = inject<MatDialogRef<UserFormComponent, UserGet>>(MatDialogRef);
  private readonly events = inject(Events);
  protected readonly userStore = inject(UsersStore);

  protected readonly roleOptions: ReadonlyArray<{ value: UserRole; label: string }> =
    USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

  protected readonly serverError = signal<string | null>(null);

  private readonly data = signal<UserFormValue>(INITIAL_VALUE);

  protected readonly createUserLoading = computed(() => this.userStore.createUserLoading());

  protected readonly userForm = form(this.data, (p) => {
    required(p.fullname, { message: 'Full name is required' });
    maxLength(p.fullname, 100, { message: 'Full name must be 100 characters or fewer' });

    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });

    required(p.role, { message: 'Role is required' });

    required(p.password, { message: 'Password is required' });
    minLength(p.password, 6, { message: 'Password must be at least 6 characters' });
    maxLength(p.password, 128, { message: 'Password must be 128 characters or fewer' });

    required(p.confirmPassword, { message: 'Please confirm the password' });
    validate(p.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(p.password)
        ? null
        : { kind: 'password-mismatch', message: 'Passwords do not match' },
    );
  });

  protected readonly canSubmit = computed(() => !this.createUserLoading());

  protected readonly fullnameError = computed(() => this.fieldError(this.userForm.fullname()));
  protected readonly emailError = computed(() => this.fieldError(this.userForm.email()));
  protected readonly roleError = computed(() => this.fieldError(this.userForm.role()));
  protected readonly passwordError = computed(() => this.fieldError(this.userForm.password()));
  protected readonly confirmPasswordError = computed(() =>
    this.fieldError(this.userForm.confirmPassword()),
  );

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.userForm().markAsTouched();

    if (!this.userForm().valid()) {
      return;
    }

    this.serverError.set(null);

    try {
      const value = this.userForm().value();
      const payload: UserPost = {
        id: crypto.randomUUID(),
        fullname: value.fullname.trim(),
        email: value.email.trim(),
        role: value.role as UserRole,
        password: value.password,
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.dispatch.createUser(payload);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Failed to create user.');
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

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

  #onCreateUserSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close())))(
    this.events.on(usersEvents.createUserSuccess),
  );
}
