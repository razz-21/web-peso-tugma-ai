import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import {
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { injectDispatch } from '@ngrx/signals/events';
import {
  ROLE_LABELS,
  STATUS_LABELS,
  USER_ROLES,
  USER_STATUSES,
  UserRole,
  UserStatus,
} from '../../core/models/user.model';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { UserDetailsStore } from '../../stores/user-details/user-details.store';
import { userDetailsEvents } from '../../stores/user-details/user-details.events';
import { APP_ROUTES } from '../../core/constants/routes.constant';

type ProfileForm = {
  fullname: string;
  email: string;
  role: UserRole;
};

type PasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

@Component({
  selector: 'app-user-details',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormField,
    AvatarComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UserDetailsStore],
})
export class UserDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly store = inject(UserDetailsStore);
  private readonly dispatch = injectDispatch(userDetailsEvents);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roleOptions = USER_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));
  protected readonly statusOptions = USER_STATUSES.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  }));

  protected readonly roleLabel = computed(() => {
    const user = this.store.user();
    return user ? ROLE_LABELS[user.role] : '';
  });
  protected readonly statusLabel = computed(() => {
    const user = this.store.user();
    return user ? STATUS_LABELS[user.status] : '';
  });
  protected readonly isActive = computed(() => this.store.user()?.status === 'active');

  private readonly profileData = signal<ProfileForm>({
    fullname: '',
    email: '',
    role: 'officer',
  });

  protected readonly profileForm = form(this.profileData, (p) => {
    required(p.fullname, { message: 'Full name is required' });
    maxLength(p.fullname, 100, { message: 'Full name must be 100 characters or fewer' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.role, { message: 'Role is required' });
  });

  private readonly passwordData = signal<PasswordForm>({ newPassword: '', confirmPassword: '' });

  protected readonly passwordForm = form(this.passwordData, (p) => {
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

  protected readonly fullnameError = computed(() => this.fieldError(this.profileForm.fullname()));
  protected readonly emailError = computed(() => this.fieldError(this.profileForm.email()));
  protected readonly newPasswordError = computed(() =>
    this.fieldError(this.passwordForm.newPassword()),
  );
  protected readonly confirmPasswordError = computed(() =>
    this.fieldError(this.passwordForm.confirmPassword()),
  );

  constructor() {
    // Keep the editable forms in sync with the loaded user.
    effect(() => {
      const user = this.store.user();
      if (user) {
        this.profileData.set({
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        });
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadUserDetails({ id });
    }
  }

  protected saveProfile(event: Event): void {
    event.preventDefault();
    const user = this.store.user();
    this.profileForm().markAsTouched();
    if (!user || !this.profileForm().valid()) {
      return;
    }
    const value = this.profileForm().value();
    this.dispatch.updateUser({
      id: user.id,
      user: {
        fullname: value.fullname.trim(),
        email: value.email.trim(),
        role: value.role,
      },
      message: 'Profile updated',
    });
  }

  protected updatePassword(event: Event): void {
    event.preventDefault();
    const user = this.store.user();
    this.passwordForm().markAsTouched();
    if (!user || !this.passwordForm().valid()) {
      return;
    }
    this.dispatch.updateUser({
      id: user.id,
      user: { password: this.passwordForm().value().newPassword },
      message: 'Password updated',
    });
    this.passwordForm().reset({ newPassword: '', confirmPassword: '' });
  }

  protected toggleActivation(): void {
    const user = this.store.user();
    if (!user) {
      return;
    }
    const deactivating = user.status === 'active';
    const data: ConfirmDialogData = deactivating
      ? {
          title: 'Deactivate account',
          message: `Deactivate <strong>${user.fullname}</strong>? They will lose access until reactivated.`,
          confirmLabel: 'Deactivate',
          destructive: true,
        }
      : {
          title: 'Activate account',
          message: `Reactivate <strong>${user.fullname}</strong>?`,
          confirmLabel: 'Activate',
        };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dispatch.updateUser({
            id: user.id,
            user: {
              status: deactivating ? 'inactive' : 'active',
              updated_at: new Date().toISOString(),
            },
            message: deactivating ? 'Account deactivated' : 'Account activated',
          });
        }
      });
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
}
