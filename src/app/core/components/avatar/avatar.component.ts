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
  template: `<span class="avatar" [class]="colorClass()" aria-hidden="true">{{
    initials()
  }}</span>`,
  styleUrl: './avatar.component.scss',
  host: { class: 'avatar-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** Display name used to derive the initials. */
  readonly name = input.required<string>();
  /** Optional seed for the background color; falls back to the name. */
  readonly seed = input('');

  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly colorClass = computed(() => avatarClassOf(this.seed() || this.name()));
}
