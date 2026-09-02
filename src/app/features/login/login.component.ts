import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { parseRetryAfterSeconds, retryAfterMessage } from '../../core/utils/retry-after.util';

type LoginData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly routes = APP_ROUTES;
  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  // Set when the backend returns 429; keeps the submit button disabled for the
  // `Retry-After` window rather than letting the user keep firing requests that
  // would only extend the lockout.
  protected readonly rateLimited = signal(false);
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly data = signal<LoginData>({ email: '', password: '', rememberMe: true });

  protected readonly loginForm = form(this.data, (p) => {
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.password, { message: 'Password is required' });
  });

  protected readonly emailError = computed(() => {
    const field = this.loginForm.email();
    return field.touched() && !field.valid()
      ? (field.errors()[0]?.message ?? 'Invalid email')
      : null;
  });

  protected readonly passwordError = computed(() => {
    const field = this.loginForm.password();
    return field.touched() && !field.valid()
      ? (field.errors()[0]?.message ?? 'Password is required')
      : null;
  });

  ngOnDestroy(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
    }
  }

  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.loginForm().markAsTouched();

    if (!this.loginForm().valid() || this.submitting() || this.rateLimited()) {
      return;
    }

    const { email, password, rememberMe } = this.loginForm().value();
    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.login({ email, password, rememberMe });
      await this.router.navigateByUrl(APP_ROUTES.main);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 429) {
        this.lockForRetry(error.headers.get('Retry-After'));
      }
      this.errorMessage.set(this.toErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  /** Disable submission until the server's `Retry-After` window elapses. */
  private lockForRetry(retryAfter: string | null): void {
    this.rateLimited.set(true);
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
    }
    // Default to 60s when the header is missing/unparseable, so the button never
    // stays disabled forever.
    const seconds = parseRetryAfterSeconds(retryAfter) ?? 60;
    this.retryTimer = setTimeout(() => {
      this.rateLimited.set(false);
      this.retryTimer = null;
    }, seconds * 1000);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Incorrect email or password.';
      }
      if (error.status === 403) {
        // Account disabled — surface the backend reason (e.g. "User is inactive").
        const detail = error.error?.detail;
        return typeof detail === 'string' ? detail : 'Your account is inactive.';
      }
      if (error.status === 429) {
        return retryAfterMessage(error.headers.get('Retry-After'));
      }
      if (error.status === 0) {
        return 'Unable to reach the server. Please try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
