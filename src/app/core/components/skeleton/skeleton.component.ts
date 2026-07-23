import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Visual shape of the placeholder. */
export type SkeletonVariant = 'text' | 'rect' | 'circle';

/**
 * Reusable shimmering placeholder shown while content loads. Compose several
 * together to mirror the shape of the real content (e.g. a card or list row).
 */
@Component({
  selector: 'app-skeleton',
  template: '',
  styleUrl: './skeleton.component.scss',
  host: {
    class: 'skeleton',
    'aria-hidden': 'true',
    '[class.skeleton--circle]': "variant() === 'circle'",
    '[class.skeleton--text]': "variant() === 'text'",
    '[style.width]': 'width()',
    '[style.height]': 'resolvedHeight()',
    '[style.border-radius]': 'radius()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  /** CSS width, e.g. '100%', '6rem', '48px'. */
  readonly width = input<string>('100%');
  /** CSS height; defaults per variant when null. */
  readonly height = input<string | null>(null);
  /** Placeholder shape. */
  readonly variant = input<SkeletonVariant>('rect');
  /** Explicit border radius; overrides the variant default when set. */
  readonly radius = input<string | null>(null);

  protected readonly resolvedHeight = computed(() => {
    const explicit = this.height();
    if (explicit) {
      return explicit;
    }
    return this.variant() === 'text' ? '0.875rem' : null;
  });
}
