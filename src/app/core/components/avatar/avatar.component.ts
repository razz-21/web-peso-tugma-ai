import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const AVATAR_CLASSES = [
  'avatar--violet',
  'avatar--green',
  'avatar--pink',
  'avatar--blue',
  'avatar--amber',
];

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const avatarClassOf = (seed: string): string => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash + char.charCodeAt(0)) % AVATAR_CLASSES.length;
  }
  return AVATAR_CLASSES[hash];
};

@Component({
  selector: 'app-avatar',
  template: `<span
    class="avatar"
    [class]="colorClass()"
    [style.width.px]="size()"
    [style.height.px]="size()"
    [style.fontSize.px]="fontSizePx()"
    [style.borderRadius.px]="borderRadiusPx()"
    aria-hidden="true"
    >{{ initials() }}</span
  >`,
  styleUrl: './avatar.component.scss',
  host: { class: 'avatar-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** Display name used to derive the initials. */
  readonly name = input.required<string>();
  /** Optional seed for the background color; falls back to the name. */
  readonly seed = input('');
  /** Optional pixel diameter; falls back to the CSS default (2.25rem) when null. */
  readonly size = input<number | null>(null);
  /** Silhouette shape; `square` renders a rounded square instead of a circle. */
  readonly shape = input<'circle' | 'square'>('circle');

  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly colorClass = computed(() => avatarClassOf(this.seed() || this.name()));
  protected readonly fontSizePx = computed(() => {
    const size = this.size();
    return size === null ? null : Math.round(size * 0.36);
  });
  protected readonly borderRadiusPx = computed(() =>
    this.shape() === 'square' ? Math.round((this.size() ?? 36) * 0.28) : null,
  );
}
