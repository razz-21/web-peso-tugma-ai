import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CIVIL_STATUS_OPTIONS,
  JobImportResult,
  MINIMUM_EDUCATION_OPTIONS,
  SEXES,
  SEX_LABELS,
} from '../../../core/models/job.model';
import { JobsService } from '../../../core/services/jobs.service';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { ImportJobReviewRow, toJobPost } from './import-job-review.model';

/** Data handed to the dialog: the company and the jobs parsed from the file. */
export interface ImportJobReviewData {
  companyId: string;
  companyName: string;
  rows: ImportJobReviewRow[];
  /** Titles already used by this company's jobs — flagged/skipped as duplicates. */
  existingTitles: string[];
}

@Component({
  selector: 'app-import-job-review',
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvatarComponent,
  ],
  templateUrl: './import-job-review.component.html',
  styleUrl: './import-job-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportJobReviewComponent {
  private readonly data = inject<ImportJobReviewData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ImportJobReviewComponent, JobImportResult>>(
    MatDialogRef,
  );
  private readonly jobsService = inject(JobsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly sexOptions = SEXES;
  protected readonly sexLabels = SEX_LABELS;
  protected readonly civilStatuses = CIVIL_STATUS_OPTIONS;
  protected readonly educationOptions = MINIMUM_EDUCATION_OPTIONS;

  protected readonly companyName = this.data.companyName;
  protected readonly rows = signal<ImportJobReviewRow[]>(this.data.rows);
  protected readonly saving = signal(false);
  protected readonly skillEditingRowId = signal<string | null>(null);
  protected readonly preferredSkillEditingRowId = signal<string | null>(null);

  /** Upper bound for the datepicker — a job can't be created in the future. */
  protected readonly today = new Date();

  /** Lower-cased titles already used by this company, for duplicate detection. */
  private readonly existingTitles = new Set(
    this.data.existingTitles.map((title) => title.trim().toLowerCase()),
  );

  protected readonly total = computed(() => this.rows().length);
  /** Rows whose title already exists for this company (skipped on save). */
  protected readonly duplicateCount = computed(
    () => this.rows().filter((row) => this.isDuplicate(row)).length,
  );
  /** Non-duplicate rows — the jobs that will actually be created. */
  protected readonly creatableCount = computed(() => this.total() - this.duplicateCount());

  protected isDuplicate(row: ImportJobReviewRow): boolean {
    return this.existingTitles.has(row.title.trim().toLowerCase());
  }

  protected removeRow(id: string): void {
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
  }

  // --- Per-row field edits ---------------------------------------------------

  private patchRow(id: string, patch: Partial<ImportJobReviewRow>): void {
    this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  protected onAgeRangeChange(id: string, value: string): void {
    this.patchRow(id, { ageRange: value });
  }

  protected onSexChange(id: string, value: string): void {
    this.patchRow(id, { sex: value });
  }

  protected onCivilStatusChange(id: string, value: string[]): void {
    this.patchRow(id, { civilStatus: value });
  }

  protected onVacanciesChange(id: string, value: string): void {
    const parsed = Number(value);
    this.patchRow(id, {
      vacancies: Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1,
    });
  }

  protected onSalaryChange(id: string, value: string): void {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    this.patchRow(id, {
      salary: trimmed && Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null,
    });
  }

  protected onEducationChange(id: string, value: string[]): void {
    this.patchRow(id, { minEducation: value });
  }

  protected onCourseChange(id: string, value: string): void {
    this.patchRow(id, { courseProgram: value });
  }

  protected onExperienceRequiredChange(id: string, value: string): void {
    this.patchRow(id, { experienceRequired: value });
  }

  protected onExperiencePreferredChange(id: string, value: string): void {
    this.patchRow(id, { experiencePreferred: value });
  }

  protected onDateCreatedChange(id: string, value: Date | null): void {
    this.patchRow(id, { dateCreated: value });
  }

  // --- Inline skills ---------------------------------------------------------

  protected removeSkill(id: string, skill: string): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, skills: row.skills.filter((s) => s !== skill) } : row,
      ),
    );
  }

  protected startAddSkill(id: string): void {
    this.skillEditingRowId.set(id);
  }

  protected commitSkill(id: string, input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value) {
      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === id && !row.skills.includes(value)
            ? { ...row, skills: [...row.skills, value] }
            : row,
        ),
      );
    }
    input.value = '';
    this.skillEditingRowId.set(null);
  }

  protected cancelAddSkill(): void {
    this.skillEditingRowId.set(null);
  }

  // --- Inline preferred skills ----------------------------------------------

  protected removePreferredSkill(id: string, skill: string): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === id
          ? { ...row, preferredSkills: row.preferredSkills.filter((s) => s !== skill) }
          : row,
      ),
    );
  }

  protected startAddPreferredSkill(id: string): void {
    this.preferredSkillEditingRowId.set(id);
  }

  protected commitPreferredSkill(id: string, input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value) {
      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === id && !row.preferredSkills.includes(value)
            ? { ...row, preferredSkills: [...row.preferredSkills, value] }
            : row,
        ),
      );
    }
    input.value = '';
    this.preferredSkillEditingRowId.set(null);
  }

  protected cancelAddPreferredSkill(): void {
    this.preferredSkillEditingRowId.set(null);
  }

  // --- Footer actions --------------------------------------------------------

  protected save(): void {
    void this.submit();
  }

  private async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }
    // Skip rows whose title already exists for this company, to avoid duplicates.
    const jobs = this.rows()
      .filter((row) => !this.isDuplicate(row))
      .map((row) => toJobPost(row, this.data.companyId));
    if (jobs.length === 0) {
      this.snackBar.open('All jobs already exist for this company — nothing to create.', 'Dismiss', {
        duration: 6000,
      });
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.jobsService.importJobs({ jobs });
      this.snackBar.open(
        `Created ${result.created} job${result.created === 1 ? '' : 's'}.`,
        'Dismiss',
        { duration: 5000 },
      );
      this.dialogRef.close(result);
    } catch {
      this.saving.set(false);
      this.snackBar.open('Could not create the jobs. Please try again.', 'Dismiss', {
        duration: 6000,
      });
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
