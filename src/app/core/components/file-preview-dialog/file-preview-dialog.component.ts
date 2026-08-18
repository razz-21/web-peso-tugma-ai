import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileRead } from '../../models/file.model';
import { FilesService } from '../../services/files.service';

export interface FilePreviewDialogData {
  /** The file to preview. */
  file: FileRead;
}

/** How a file renders in the preview: inline, or download-only. */
type PreviewKind = 'image' | 'pdf' | 'text' | 'unsupported';

/**
 * Previews a stored file in a dialog: images and PDFs render inline, plain-text
 * and CSV are shown as text, and anything the browser can't display falls back
 * to a download prompt. Bytes are fetched once through the authenticated proxy.
 */
@Component({
  selector: 'app-file-preview-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './file-preview-dialog.component.html',
  styleUrl: './file-preview-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePreviewDialogComponent {
  private readonly filesService = inject(FilesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly data = inject<FilePreviewDialogData>(MAT_DIALOG_DATA);
  protected readonly file = this.data.file;
  protected readonly kind: PreviewKind = this.kindFor(this.file.content_type);
  protected readonly icon = this.iconFor(this.kind);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly downloading = signal(false);
  /** Object URL for image/PDF previews (null until the bytes load). */
  protected readonly objectUrl = signal<string | null>(null);
  /** Sanitized object URL, required for the PDF `<iframe>`. */
  protected readonly safeUrl = signal<SafeResourceUrl | null>(null);
  /** Decoded contents for text/CSV previews. */
  protected readonly textContent = signal<string | null>(null);

  constructor() {
    // Nothing to fetch for types we can't render — offer a download instead.
    if (this.kind === 'unsupported') {
      this.loading.set(false);
    } else {
      void this.load();
    }

    inject(DestroyRef).onDestroy(() => {
      const url = this.objectUrl();
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
  }

  private async load(): Promise<void> {
    try {
      const blob = await this.filesService.fetchBlob(this.file.id);
      if (this.kind === 'text') {
        this.textContent.set(await blob.text());
      } else {
        const url = URL.createObjectURL(blob);
        this.objectUrl.set(url);
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onDownload(): Promise<void> {
    if (this.downloading()) {
      return;
    }
    this.downloading.set(true);
    try {
      await this.filesService.download(this.file);
    } catch {
      this.snackBar.open("Couldn't download the file.", 'Close', { duration: 3000 });
    } finally {
      this.downloading.set(false);
    }
  }

  private kindFor(contentType: string): PreviewKind {
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    if (contentType.includes('pdf')) {
      return 'pdf';
    }
    if (contentType.startsWith('text/')) {
      return 'text';
    }
    return 'unsupported';
  }

  private iconFor(kind: PreviewKind): string {
    if (kind === 'image') {
      return 'image';
    }
    if (kind === 'pdf') {
      return 'picture_as_pdf';
    }
    return 'description';
  }
}
