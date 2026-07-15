import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Label + value pair that falls back to a "Not indicated" chip when empty. */
@Component({
  selector: 'app-detail-field',
  imports: [MatIconModule],
  template: `
    <span class="detail-field__label">{{ label() }}</span>
    @if (hasValue()) {
      <span class="detail-field__value">{{ value() }}</span>
    } @else {
      <span class="detail-field__chip">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        Not indicated
      </span>
    }
  `,
  styleUrl: './detail-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailFieldComponent {
  readonly label = input.required<string>();
  readonly value = input<string | null | undefined>();

  protected readonly hasValue = computed(() => {
    const value = this.value();
    return value !== null && value !== undefined && value.trim().length > 0;
  });
}
