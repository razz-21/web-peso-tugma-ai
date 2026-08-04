import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileRead } from '../../models/file.model';
import { FilesService } from '../../services/files.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import {
  FileUploadDialogComponent,
  FileUploadDialogData,
} from '../file-upload-dialog/file-upload-dialog.component';

const KB = 1024;

/**
 * Reusable files panel: lists the files linked to `foreignId`, lets the user
 * upload (via `app-file-upload`), download, and delete them. Not tied to
 * applicants — any record that owns files can drop this in.
 */
@Component({
  selector: 'app-files-panel',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './files-panel.component.html',
  styleUrl: './files-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesPanelComponent {
  private readonly filesService = inject(FilesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Id of the record whose files are shown. */
  readonly foreignId = input.required<string>();
  /** When true, uploading and deleting are disabled (record is read-only). */
  readonly disabled = input(false);

  protected readonly files = signal<FileRead[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  /** Id of the file currently downloading (drives its spinner), or null. */
  protected readonly downloadingId = signal<string | null>(null);
  /** Id of the file currently deleting, or null. */
  protected readonly deletingId = signal<string | null>(null);

  constructor() {
    // Load (and reload) whenever the target record changes.
    effect(() => {
      const id = this.foreignId();
      if (id) {
        void this.load(id);
      }
    });
  }

  private async load(foreignId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.files.set(await this.filesService.list(foreignId));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected onUpload(): void {
    if (this.disabled()) {
      return;
    }
    const data: FileUploadDialogData = { foreignId: this.foreignId() };
    this.dialog
      .open<FileUploadDialogComponent, FileUploadDialogData, FileRead[]>(
        FileUploadDialogComponent,
        {
          width: '480px',
          maxWidth: '95vw',
          restoreFocus: true,
          data,
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((uploaded) => {
        if (uploaded?.length) {
          // Prepend the newly uploaded files — the list is sorted newest-first.
          this.files.update((files) => [...uploaded, ...files]);
          const count = uploaded.length;
          this.snackBar.open(count === 1 ? 'File uploaded.' : `${count} files uploaded.`, 'Close', {
            duration: 2500,
          });
        }
      });
  }

  protected async onDownload(file: FileRead): Promise<void> {
    if (this.downloadingId()) {
      return;
    }
    this.downloadingId.set(file.id);
    try {
      await this.filesService.download(file);
    } catch {
      this.snackBar.open("Couldn't download the file.", 'Close', { duration: 3000 });
    } finally {
      this.downloadingId.set(null);
    }
  }

  protected onDelete(file: FileRead): void {
    if (this.disabled()) {
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Delete file?',
      message: `Are you sure you want to delete <strong>${file.filename}</strong>? This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          void this.deleteFile(file);
        }
      });
  }

  private async deleteFile(file: FileRead): Promise<void> {
    this.deletingId.set(file.id);
    try {
      await this.filesService.delete(file.id);
      this.files.update((files) => files.filter((f) => f.id !== file.id));
      this.snackBar.open('File deleted.', 'Close', { duration: 2500 });
    } catch {
      this.snackBar.open("Couldn't delete the file.", 'Close', { duration: 3000 });
    } finally {
      this.deletingId.set(null);
    }
  }

  /** Material icon for a file, chosen from its content type. */
  protected fileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    if (contentType.includes('pdf')) {
      return 'picture_as_pdf';
    }
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      return 'table_chart';
    }
    if (contentType.includes('csv')) {
      return 'grid_on';
    }
    return 'description';
  }

  protected formatSize(bytes: number): string {
    if (bytes < KB) {
      return `${bytes} B`;
    }
    const kb = bytes / KB;
    if (kb < KB) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / KB).toFixed(1)} MB`;
  }
}
