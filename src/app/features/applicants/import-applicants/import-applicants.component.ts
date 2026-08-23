import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Accepted upload constraints, surfaced in the UI and enforced on select/drop. */
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'] as const;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Static template shipped in assets, offered via "Download template". */
const TEMPLATE_PATH = 'assets/templates/PESOTugmai Import Applicant Template.xlsx';
const TEMPLATE_FILENAME = 'PESOTugmai Import Applicant Template.xlsx';

@Component({
  selector: 'app-import-applicants',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './import-applicants.component.html',
  styleUrl: './import-applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportApplicantsComponent {
  private readonly dialogRef = inject<MatDialogRef<ImportApplicantsComponent, File>>(MatDialogRef);

  protected readonly maxSizeLabel = '5 MB';

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canImport = computed(() => this.selectedFile() !== null);

  /** Open the OS file picker via the hidden input. */
  protected onBrowse(input: HTMLInputElement): void {
    input.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      this.validateAndSet(file);
    }
    // Reset so selecting the same file again re-triggers the change event.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) {
      this.validateAndSet(file);
    }
  }

  protected clearFile(): void {
    this.selectedFile.set(null);
    this.error.set(null);
  }

  /** Download the static Excel template shipped in assets. */
  protected onDownloadTemplate(): void {
    const anchor = document.createElement('a');
    anchor.href = encodeURI(TEMPLATE_PATH);
    anchor.download = TEMPLATE_FILENAME;
    anchor.click();
  }

  protected onImport(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    this.dialogRef.close(file);
  }

  protected onClose(): void {
    this.dialogRef.close();
  }

  private validateAndSet(file: File): void {
    const name = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasValidExtension) {
      this.error.set('Only Excel (.xlsx) or CSV files are allowed.');
      this.selectedFile.set(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.error.set(`File is too large. Maximum size is ${this.maxSizeLabel}.`);
      this.selectedFile.set(null);
      return;
    }
    this.error.set(null);
    this.selectedFile.set(file);
  }
}
