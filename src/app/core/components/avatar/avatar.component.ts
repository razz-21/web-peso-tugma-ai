import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AvatarCropperData,
  AvatarCropperDialogComponent,
} from './avatar-cropper-dialog/avatar-cropper-dialog.component';

const AVATAR_CLASSES = [
  'avatar--violet',
  'avatar--green',
  'avatar--pink',
  'avatar--blue',
  'avatar--amber',
];

/** Default cap (5 MB) and accepted image types for editable avatars. */
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

// When cropping, the emitted file is a small re-encoded PNG (<=512px) regardless
// of the input size, so the strict limit doesn't apply to the picked file — we
// only reject inputs large enough to stall decoding. This also avoids a
// confusing rejection on macOS, where picking a HEIC (with HEIC excluded from
// `accept`) transcodes it to a much larger JPEG that can exceed the 5 MB limit
// even though the original HEIC is tiny.
const MAX_DECODE_BYTES = 40 * 1024 * 1024;

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
  imports: [MatIconModule, MatMenuModule, MatProgressSpinnerModule],
  template: `<span class="avatar-wrap" [style.width.px]="size()" [style.height.px]="size()">
    @if (image()) {
      <img
        class="avatar avatar--image"
        [src]="image()"
        [alt]="name() + ' avatar'"
        [style.width.px]="size()"
        [style.height.px]="size()"
      />
    } @else {
      <span
        class="avatar"
        [class]="colorClass()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.fontSize.px]="fontSizePx()"
        aria-hidden="true"
        >{{ initials() }}</span
      >
    }

    @if (editable()) {
      <button
        type="button"
        class="avatar__camera"
        [disabled]="uploading()"
        [style.width.px]="badgeSize()"
        [style.height.px]="badgeSize()"
        [attr.aria-label]="'Change ' + name() + ' avatar'"
        [matMenuTriggerFor]="avatarMenu"
      >
        <mat-icon
          [style.fontSize.px]="iconSize()"
          [style.width.px]="iconSize()"
          [style.height.px]="iconSize()"
          >photo_camera</mat-icon
        >
      </button>

      <mat-menu #avatarMenu="matMenu">
        <button type="button" mat-menu-item (click)="openPicker()">
          <mat-icon>upload</mat-icon>
          <span>Upload photo</span>
        </button>
        @if (image()) {
          <button type="button" mat-menu-item (click)="removeRequested.emit()">
            <mat-icon>delete</mat-icon>
            <span>Remove photo</span>
          </button>
        }
      </mat-menu>

      @if (uploading()) {
        <span class="avatar__overlay" role="status" aria-label="Uploading avatar">
          <mat-progress-spinner
            mode="indeterminate"
            [diameter]="spinnerSize()"
            aria-hidden="true"
          />
        </span>
      }

      <input
        #fileInput
        type="file"
        class="avatar__file"
        [accept]="acceptAttr"
        (change)="onFileChange($event)"
      />
    }
  </span>`,
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
  /** Optional image URL; when set it renders instead of the initials. */
  readonly image = input<string | null>(null);
  /** When true, shows a camera badge that opens a file picker. */
  readonly editable = input(false);
  /** Shows a spinner overlay while an upload is in flight. */
  readonly uploading = input(false);
  /** Maximum accepted file size in bytes (editable mode only). */
  readonly maxSizeBytes = input(DEFAULT_MAX_BYTES);
  /** When true (default), a crop dialog opens before the file is emitted. */
  readonly crop = input(true);

  /** Emits the (optionally cropped) file once it passes the type/size checks. */
  readonly fileSelected = output<File>();
  /** Emits when the user chooses to remove the current avatar. */
  readonly removeRequested = output<void>();
  /** Emits a human-readable reason when the picked file is rejected. */
  readonly invalid = output<string>();

  protected readonly acceptAttr = ACCEPTED_TYPES.filter((t) => t !== 'image/jpg').join(',');

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly colorClass = computed(() => avatarClassOf(this.seed() || this.name()));
  protected readonly fontSizePx = computed(() => {
    const size = this.size();
    return size === null ? null : Math.round(size * 0.36);
  });
  protected readonly badgeSize = computed(() =>
    Math.max(20, Math.round((this.size() ?? 36) * 0.36)),
  );
  protected readonly iconSize = computed(() => Math.round(this.badgeSize() * 0.6));
  protected readonly spinnerSize = computed(() => Math.round((this.size() ?? 36) * 0.5));

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Reset so re-selecting the same file still fires a change event.
    input.value = '';
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.invalid.emit('Only JPEG, PNG, WebP, or GIF images are supported.');
      return;
    }
    // With cropping on, the picked file is downsized before upload, so guard only
    // against very large inputs; without cropping, enforce the real size limit.
    const willCrop = this.crop();
    const limitBytes = willCrop ? MAX_DECODE_BYTES : this.maxSizeBytes();
    if (file.size > limitBytes) {
      const mb = Math.round(limitBytes / (1024 * 1024));
      this.invalid.emit(`Image exceeds the ${mb} MB limit.`);
      return;
    }
    if (willCrop) {
      this.openCropper(file);
      return;
    }
    this.fileSelected.emit(file);
  }

  private openCropper(file: File): void {
    this.dialog
      .open<AvatarCropperDialogComponent, AvatarCropperData, File>(AvatarCropperDialogComponent, {
        width: '26rem',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: { file, fileName: file.name },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cropped) => {
        // Undefined when the user cancels; only emit an actual cropped file.
        if (cropped) {
          this.fileSelected.emit(cropped);
        }
      });
  }
}
