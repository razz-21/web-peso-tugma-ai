import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface LoadingDialogData {
  /** Bold title shown under the spinner, e.g. "Referring applicant". */
  message: string;
  /** Optional muted subtitle under the title, e.g. "Sending the referral". */
  hint?: string;
}

/**
 * Small blocking dialog: a centered spinner over a bold title (with animated
 * trailing dots) and an optional muted subtitle, shown while a short operation
 * is in flight. Opened with `disableClose`, so the caller closes it when the
 * operation settles.
 */
@Component({
  selector: 'app-loading-dialog',
  imports: [MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-dialog" role="status" aria-live="polite">
      <mat-spinner diameter="52" strokeWidth="4" aria-hidden="true"></mat-spinner>
      <p class="loading-dialog__title">
        {{ data.message
        }}<span class="loading-dialog__dots" aria-hidden="true">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
      @if (data.hint) {
        <p class="loading-dialog__hint">{{ data.hint }}</p>
      }
    </div>
  `,
  styles: `
    .loading-dialog {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.25rem;
      padding: 2.5rem 2.75rem;
    }

    .loading-dialog__title {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 700;
      line-height: 1.3;
      color: var(--mat-sys-on-surface);
    }

    .loading-dialog__dots {
      color: var(--mat-sys-on-surface-variant);
      letter-spacing: 0.15em;
    }

    .loading-dialog__dots span {
      animation: loading-dialog-dot 1.4s ease-in-out infinite;
    }

    .loading-dialog__dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loading-dialog__dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    .loading-dialog__hint {
      margin: -0.5rem 0 0;
      font-size: 0.95rem;
      color: var(--mat-sys-on-surface-variant);
    }

    @keyframes loading-dialog-dot {
      0%,
      60%,
      100% {
        opacity: 0.25;
      }
      30% {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .loading-dialog__dots span {
        animation: none;
        opacity: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDialogComponent {
  protected readonly data = inject<LoadingDialogData>(MAT_DIALOG_DATA);
}
