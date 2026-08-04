import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FileRead } from '../../models/file.model';
import { FileUploadComponent } from '../file-upload/file-upload.component';

export interface FileUploadDialogData {
  /** Id of the record the uploaded files belong to. */
  foreignId: string;
}

/**
 * Dialog wrapper around `app-file-upload`. Lets the user upload one or more
 * files for `foreignId`, accumulates what was stored, and returns the list to
 * the caller when closed so it can update its view.
 */
@Component({
  selector: 'app-file-upload-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, FileUploadComponent],
  template: `
    <h2 mat-dialog-title class="file-upload-dialog__title">Upload files</h2>
    <mat-dialog-content>
      <app-file-upload [foreignId]="data.foreignId" (uploaded)="onUploaded($event)" />

      @if (uploaded().length > 0) {
        <ul class="file-upload-dialog__list" aria-label="Uploaded files">
          @for (file of uploaded(); track file.id) {
            <li class="file-upload-dialog__item">
              <mat-icon aria-hidden="true">check_circle</mat-icon>
              <span class="file-upload-dialog__item-name">{{ file.filename }}</span>
            </li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="tonal" type="button" (click)="done()">
        {{ uploaded().length > 0 ? 'Done' : 'Close' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .file-upload-dialog__title {
      margin: 0;
    }

    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: min(28rem, 80vw);
    }

    .file-upload-dialog__list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .file-upload-dialog__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--mat-sys-on-surface);

      mat-icon {
        width: 1.25rem;
        height: 1.25rem;
        font-size: 1.25rem;
        color: var(--mat-sys-primary);
      }
    }

    .file-upload-dialog__item-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadDialogComponent {
  protected readonly data = inject<FileUploadDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<FileUploadDialogComponent, FileRead[]>>(MatDialogRef);

  /** Files stored during this dialog session, in upload order. */
  protected readonly uploaded = signal<FileRead[]>([]);

  protected onUploaded(file: FileRead): void {
    this.uploaded.update((files) => [...files, file]);
  }

  protected done(): void {
    this.dialogRef.close(this.uploaded());
  }
}
