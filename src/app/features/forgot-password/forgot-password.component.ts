import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type ForgotPasswordData = {
  email: string;
};

@Component({
  selector: 'app-forgot-password',
  imports: [
    FormField,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  protected readonly submitted = signal(false);
  protected readonly submittedEmail = signal('');

  private readonly data = signal<ForgotPasswordData>({ email: '' });

  protected readonly forgotForm = form(this.data, (p) => {
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
  });

  protected readonly emailError = computed(() => {
    const field = this.forgotForm.email();
    return field.touched() && !field.valid()
      ? (field.errors()[0]?.message ?? 'Invalid email')
      : null;
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.forgotForm().markAsTouched();

    if (!this.forgotForm().valid()) {
      return;
    }

    // TODO: delegate to the auth service to send the reset email.
    this.submittedEmail.set(this.forgotForm().value().email);
    this.submitted.set(true);
  }
}
