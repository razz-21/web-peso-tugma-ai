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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicantsService } from '../../../../core/services/applicants.service';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

const KB = 1024;
const MAX_BYTES = 10 * 1024 * 1024;

/** Human labels for the prefill-review summary, in display order. Name fields
 *  collapse into a single "Name" chip. */
const REST_LABELS: readonly [string, string][] = [
  ['sex', 'Sex'],
  ['date_of_birth', 'Date of birth'],
  ['email_address', 'Email'],
  ['primary_mobile_number', 'Mobile number'],
  ['educational_background', 'Education'],
  ['technical_skills', 'Skills'],
  ['work_experience', 'Work experience'],
  ['trainings', 'Trainings'],
  ['eligibility', 'Eligibility'],
];
const NAME_KEYS = ['firstname', 'middlename', 'lastname', 'suffix'];

@Component({
  selector: 'app-applicant-upload-files',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './applicant-upload-files.component.html',
  styleUrl: './applicant-upload-files.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantUploadFilesComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  private readonly applicants = inject(ApplicantsService);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** True while a file is being dragged over the drop zone (drives styling). */
  protected readonly dragActive = signal(false);
  /** Surfaced when a file is rejected or extraction fails. */
  protected readonly errorMessage = signal<string | null>(null);
  /** True while the backend is parsing the resume. */
  protected readonly extracting = signal(false);

  protected readonly resumeFile = this.store.resumeFile;

  /** Ordered human labels of the fields prefilled from the resume. */
  protected readonly prefilledLabels = computed<string[]>(() => {
    const keys = this.store.prefilledFields() as ReadonlySet<string>;
    const labels: string[] = [];
    if (NAME_KEYS.some((key) => keys.has(key))) {
      labels.push('Name');
    }
    for (const [key, label] of REST_LABELS) {
      if (keys.has(key)) {
        labels.push(label);
      }
    }
    return labels;
  });

  protected readonly extracted = computed(() => this.prefilledLabels().length > 0);

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.stage(input.files?.[0] ?? null);
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
    void this.stage(event.dataTransfer?.files?.[0] ?? null);
  }

  protected removeFile(): void {
    this.store.clearResume();
    this.errorMessage.set(null);
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

  private async stage(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    if (!this.isPdf(file)) {
      this.errorMessage.set('Only PDF resumes are supported.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.errorMessage.set('File exceeds the 10 MB limit.');
      return;
    }
    this.errorMessage.set(null);
    this.store.setResumeFile(file);
    await this.extract(file);
  }

  private async extract(file: File): Promise<void> {
    this.extracting.set(true);
    try {
      const extraction = await this.applicants.extract(file);
      this.store.applyExtraction(extraction);
    } catch {
      this.errorMessage.set("Couldn't read the file — please fill the fields manually.");
    } finally {
      this.extracting.set(false);
    }
  }

  private isPdf(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}
