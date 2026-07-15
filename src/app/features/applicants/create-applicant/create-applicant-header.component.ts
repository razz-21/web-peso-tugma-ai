import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-applicant-header',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <header class="wizard-header">
      <div class="wizard-header__lead">
        <button
          mat-icon-button
          type="button"
          class="wizard-header__close"
          aria-label="Close create applicant"
          (click)="close.emit()"
        >
          <mat-icon>close</mat-icon>
        </button>
        <div class="wizard-header__titles">
          <h2 class="wizard-header__title">{{ title() }}</h2>
          <p class="wizard-header__step">{{ stepLabel() }}</p>
        </div>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    .wizard-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
    }

    .wizard-header__lead {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }
    .wizard-header__titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .wizard-header__title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--mat-sys-on-surface);
    }

    .wizard-header__step {
      margin: 0;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApplicantHeaderComponent {
  readonly title = input.required<string>();
  readonly stepLabel = input.required<string>();
  readonly close = output<void>();
  readonly saveDraft = output<void>();
}
