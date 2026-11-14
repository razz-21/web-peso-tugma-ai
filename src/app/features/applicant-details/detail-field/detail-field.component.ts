import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Label + value pair rendered as a `<dt>`/`<dd>` group. Attach it to a `<div>`
 * inside a `<dl>` (`<div appDetailField …>`) so the definition list stays valid.
 * Empty values read as a muted "Not indicated".
 */
@Component({
  selector: '[appDetailField]',
  template: `
    <dt class="detail-field__label">{{ label() }}</dt>
    @if (hasValue()) {
      <dd class="detail-field__value">{{ value() }}</dd>
    } @else {
      <dd class="detail-field__value detail-field__value--empty">Not indicated</dd>
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
