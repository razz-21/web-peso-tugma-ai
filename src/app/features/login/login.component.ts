import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected readonly hidePassword = signal(true);

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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.loginForm().markAsTouched();

    if (!this.loginForm().valid()) {
      return;
    }

    // TODO: delegate credentials to the auth service once available.
    const credentials = this.loginForm().value();
    void credentials;
  }
}
