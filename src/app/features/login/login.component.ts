import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

type LoginData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    RouterLink,
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
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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

  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.loginForm().markAsTouched();

    if (!this.loginForm().valid() || this.submitting()) {
      return;
    }

    const { email, password, rememberMe } = this.loginForm().value();
    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.login({ email, password, rememberMe });
      await this.router.navigateByUrl('/main');
    } catch (error) {
      this.errorMessage.set(this.toErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Incorrect email or password.';
      }
      if (error.status === 0) {
        return 'Unable to reach the server. Please try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
