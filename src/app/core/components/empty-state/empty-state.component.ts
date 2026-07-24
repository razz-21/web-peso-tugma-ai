import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Centered empty-state placeholder: a rounded icon tile, a title, and an
 * optional supporting line. Drop it in wherever a list or panel has no content
 * to show.
 */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `<div class="empty-state">
    <span class="empty-state__icon" aria-hidden="true">
      <mat-icon>{{ icon() }}</mat-icon>
    </span>
    <h3 class="empty-state__title">{{ title() }}</h3>
    @if (text()) {
      <p class="empty-state__text">{{ text() }}</p>
    }
    <!-- Optional action(s), e.g. a "Create" button. -->
    <ng-content />
  </div>`,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
      padding: 3rem 1.75rem;
    }

    .empty-state__icon {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 1.75rem;
      }
    }

    .empty-state__title {
      margin: 0.25rem 0 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .empty-state__text {
      max-width: 34rem;
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /** Material icon name shown in the tile. */
  readonly icon = input('inbox');
  /** Bold headline. */
  readonly title = input.required<string>();
  /** Optional supporting sentence beneath the title. */
  readonly text = input('');
}
