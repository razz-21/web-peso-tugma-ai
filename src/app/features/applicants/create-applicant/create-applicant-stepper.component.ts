import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep } from './wizard-steps';

@Component({
  selector: 'app-create-applicant-stepper',
  imports: [MatIconModule],
  template: `
    <nav aria-label="Create applicant steps">
      <ol class="stepper">
        @for (step of steps(); track step.label; let i = $index) {
          <li>
            <button
              type="button"
              class="stepper__item"
              [class.is-active]="i === current()"
              [class.is-complete]="i < current()"
              [attr.aria-current]="i === current() ? 'step' : null"
              (click)="select.emit(i)"
            >
              <span class="stepper__badge" aria-hidden="true">
                @if (i < current()) {
                  <mat-icon>check</mat-icon>
                } @else {
                  {{ i + 1 }}
                }
              </span>
              <span class="stepper__text">
                <span class="stepper__label">{{ step.label }}</span>
                @if (step.optional) {
                  <span class="stepper__optional">Optional</span>
                }
              </span>
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }

    .stepper {
      list-style: none;
      margin: 0;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stepper__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 0;
      border-radius: 0.75rem;
      background: transparent;
      font: inherit;
      text-align: left;
      cursor: pointer;
      color: var(--mat-sys-on-surface-variant);
    }

    .stepper__item:hover {
      background: color-mix(in srgb, var(--mat-sys-on-surface) 6%, transparent);
    }

    .stepper__item:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }

    .stepper__item.is-active {
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      color: var(--mat-sys-on-surface);
    }

    .stepper__badge {
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 999px;
      border: 1px solid var(--mat-sys-outline);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
    }

    .stepper__badge mat-icon {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
    }

    .stepper__item.is-active .stepper__badge {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .stepper__item.is-complete .stepper__badge {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .stepper__label {
      display: block;
    }

    .stepper__item.is-active .stepper__label {
      font-weight: 700;
    }

    .stepper__optional {
      display: block;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApplicantStepperComponent {
  readonly steps = input.required<readonly WizardStep[]>();
  readonly current = input.required<number>();
  readonly select = output<number>();
}
