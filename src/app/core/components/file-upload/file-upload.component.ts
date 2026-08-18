import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ALLOWED_FILE_TYPES, FILE_ACCEPT, FILE_MAX_BYTES, FileRead } from '../../models/file.model';
import { FilesService } from '../../services/files.service';

/**
 * Generic file upload drop zone. Uploads the selected file against the given
 * `foreignId` via the `/files` API and emits `uploaded` on success. Reusable for
 * any record that owns files (not applicant-specific).
 */
@Component({
  selector: 'app-file-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="file-upload">
      <button
        type="button"
        class="file-upload__zone"
        [class.file-upload__zone--active]="dragActive()"
        [disabled]="disabled() || uploading()"
        (click)="openPicker()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        aria-label="Upload a file. Drag and drop a file here, or activate to browse."
      >
        @if (uploading()) {
          <mat-progress-spinner mode="indeterminate" [diameter]="28" />
          <p class="file-upload__prompt">
            <span class="file-upload__prompt-strong">Uploading&hellip;</span>
          </p>
        } @else {
          <mat-icon class="file-upload__icon" aria-hidden="true">cloud_upload</mat-icon>
          <p class="file-upload__prompt">
            <span class="file-upload__prompt-strong">Drag &amp; drop a file here</span>
            <span class="file-upload__prompt-muted">or click to browse</span>
          </p>
          <p class="file-upload__hint">PDF, image, Office doc, or text &mdash; up to 10&nbsp;MB.</p>
        }
      </button>

      <input
        #fileInput
        type="file"
        class="file-upload__input"
        [accept]="accept"
        tabindex="-1"
        aria-hidden="true"
        (change)="onFileChange($event)"
      />

      @if (errorMessage(); as msg) {
        <p class="file-upload__error" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          {{ msg }}
        </p>
      }
    </div>
  `,
  styles: `
    .file-upload {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .file-upload__zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 1.75rem 1.25rem;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 0.9rem;
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        background 0.15s ease;
    }

    .file-upload__zone:hover:not(:disabled),
    .file-upload__zone--active {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-surface-container);
    }

    .file-upload__zone:disabled {
      cursor: default;
      opacity: 0.7;
    }

    .file-upload__zone:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }

    .file-upload__icon {
      width: 2rem;
      height: 2rem;
      font-size: 2rem;
      color: var(--mat-sys-primary);
    }

    .file-upload__prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      margin: 0;
    }

    .file-upload__prompt-strong {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .file-upload__prompt-muted {
      font-size: 0.85rem;
    }

    .file-upload__hint {
      margin: 0;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .file-upload__input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .file-upload__error {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      color: var(--mat-sys-error);
      font-size: 0.85rem;

      mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  private readonly files = inject(FilesService);

  /** Id of the record the uploaded file belongs to. */
  readonly foreignId = input.required<string>();
  /** Disables the drop zone (e.g. when the owning record is inactive). */
  readonly disabled = input(false);

  /** Emitted with the stored file's metadata once an upload succeeds. */
  readonly uploaded = output<FileRead>();

  protected readonly accept = FILE_ACCEPT;

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly dragActive = signal(false);
  protected readonly uploading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected openPicker(): void {
    if (this.disabled() || this.uploading()) {
      return;
    }
    this.fileInput().nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.upload(input.files?.[0] ?? null);
    // Reset so selecting the same file again still fires a change event.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled() && !this.uploading()) {
      this.dragActive.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    if (this.disabled() || this.uploading()) {
      return;
    }
    void this.upload(event.dataTransfer?.files?.[0] ?? null);
  }

  private async upload(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    if (file.size > FILE_MAX_BYTES) {
      this.errorMessage.set('File exceeds the 10 MB limit.');
      return;
    }
    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
      this.errorMessage.set('Unsupported file type.');
      return;
    }
    this.errorMessage.set(null);
    this.uploading.set(true);
    try {
      const stored = await this.files.upload(this.foreignId(), file);
      this.uploaded.emit(stored);
    } catch {
      this.errorMessage.set("Couldn't upload the file. Please try again.");
    } finally {
      this.uploading.set(false);
    }
  }
}
