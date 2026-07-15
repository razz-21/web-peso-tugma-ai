import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-applicant-footer',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <footer class="wizard-footer">
      <button
        mat-stroked-button
        type="button"
        class="wizard-footer__btn"
        [disabled]="!canBack() || submitting()"
        (click)="back.emit()"
      >
        <mat-icon>arrow_back</mat-icon>
        Back
      </button>

      <button
        mat-flat-button
        type="button"
        class="wizard-footer__btn"
        [disabled]="submitting()"
        (click)="next.emit()"
      >
        @if (submitting()) {
          <mat-progress-spinner mode="indeterminate" diameter="20" aria-hidden="true" />
        }
        <span>{{ submitting() ? 'Creating...' : isLast() ? 'Create applicant' : 'Next' }}</span>
        @if (!submitting() && !isLast()) {
          <mat-icon>arrow_forward</mat-icon>
        }
      </button>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }

    .wizard-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
    }

    .wizard-footer__btn {
      border-radius: 999px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApplicantFooterComponent {
  readonly canBack = input.required<boolean>();
  readonly isLast = input.required<boolean>();
  readonly submitting = input(false);
  readonly back = output<void>();
  readonly next = output<void>();
}
