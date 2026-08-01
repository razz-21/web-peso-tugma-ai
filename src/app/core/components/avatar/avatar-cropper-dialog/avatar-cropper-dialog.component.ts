import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

export interface AvatarCropperData {
  /** The image the user picked; loaded straight into the cropper. */
  file: File;
  /** Base name used for the produced file (extension is replaced with .png). */
  fileName?: string;
}

/** Square/round avatar cropper. Resolves with the cropped PNG File, or undefined on cancel. */
@Component({
  selector: 'app-avatar-cropper-dialog',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, ImageCropperComponent],
  templateUrl: './avatar-cropper-dialog.component.html',
  styleUrl: './avatar-cropper-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarCropperDialogComponent {
  protected readonly data = inject<AvatarCropperData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<AvatarCropperDialogComponent, File>>(MatDialogRef);

  private croppedBlob: Blob | null = null;
  protected readonly ready = signal(false);
  protected readonly failed = signal(false);

  protected onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  protected onReady(): void {
    this.ready.set(true);
  }

  protected onFailed(): void {
    this.failed.set(true);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    if (!this.croppedBlob) {
      return;
    }
    const file = new File([this.croppedBlob], this.outputName(), { type: 'image/png' });
    this.dialogRef.close(file);
  }

  private outputName(): string {
    const base = (this.data.fileName ?? 'avatar').replace(/\.[^.]+$/, '') || 'avatar';
    return `${base}.png`;
  }
}
