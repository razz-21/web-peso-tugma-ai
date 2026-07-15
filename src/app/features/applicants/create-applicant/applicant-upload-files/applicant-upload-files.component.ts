import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

const KB = 1024;

@Component({
  selector: 'app-applicant-upload-files',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './applicant-upload-files.component.html',
  styleUrl: './applicant-upload-files.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantUploadFilesComponent {
  protected readonly store = inject(CreateApplicantDraftStore);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** True while a file is being dragged over the drop zone (drives styling). */
  protected readonly dragActive = signal(false);
  /** Surfaced when files are rejected for not being CSV. */
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly files = this.store.uploadedFiles;
  protected readonly hasFiles = computed(() => this.files().length > 0);

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.stage(input.files);
    // Reset so selecting the same file again still fires a change event.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    this.stage(event.dataTransfer?.files ?? null);
  }

  protected remove(index: number): void {
    this.store.removeFile(index);
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

  private stage(list: FileList | null): void {
    if (!list || list.length === 0) {
      return;
    }
    const { rejected } = this.store.addFiles(Array.from(list));
    this.errorMessage.set(
      rejected > 0
        ? `${rejected} file${rejected > 1 ? 's were' : ' was'} skipped — only CSV files are allowed.`
        : null,
    );
  }
}
