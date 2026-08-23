import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../../core/models/company.model';
import { JobGet } from '../../../core/models/job.model';
import { ApplicantImportResult, SEXES } from '../../../core/models/applicant.model';
import { CIVIL_STATUSES } from '../../../core/models/applicant.model';
import { ApplicantsService } from '../../../core/services/applicants.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { JobsService } from '../../../core/services/jobs.service';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { ASSIGNMENT_STATUSES, ImportReviewRow, toImportItem } from './import-review.model';

/** Data handed to the dialog: the applicants parsed from the imported CSV. */
export interface ImportReviewData {
  rows: ImportReviewRow[];
}

@Component({
  selector: 'app-import-review',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvatarComponent,
  ],
  templateUrl: './import-review.component.html',
  styleUrl: './import-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportReviewComponent {
  private readonly data = inject<ImportReviewData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ImportReviewComponent, ApplicantImportResult>>(
    MatDialogRef,
  );
  private readonly applicantsService = inject(ApplicantsService);
  private readonly companiesService = inject(CompaniesService);
  private readonly jobsService = inject(JobsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** True while the import request is in flight (disables the action buttons). */
  protected readonly saving = signal(false);

  protected readonly genders = SEXES;
  protected readonly civilStatuses = CIVIL_STATUSES;
  protected readonly statuses = ASSIGNMENT_STATUSES;

  protected readonly rows = signal<ImportReviewRow[]>(this.data.rows);
  protected readonly companies = signal<readonly CompanyGet[]>([]);
  protected readonly companiesLoading = signal(true);
  protected readonly companiesError = signal(false);

  /** Active job vacancies keyed by company id, loaded lazily on selection. */
  private readonly jobsByCompany = signal<Record<string, readonly JobGet[]>>({});
  /** Company ids whose jobs are currently being fetched. */
  private readonly jobsLoading = signal<ReadonlySet<string>>(new Set());

  // Bulk "Apply to all" selections.
  protected readonly bulkCompanyId = signal<string | null>(null);
  protected readonly bulkJobId = signal<string | null>(null);
  protected readonly bulkStatus = signal<string | null>(null);

  // Inline skill editing.
  protected readonly skillEditingRowId = signal<string | null>(null);

  protected readonly total = computed(() => this.rows().length);
  protected readonly assignedCount = computed(
    () => this.rows().filter((row) => row.jobId !== null).length,
  );
  protected readonly registeredOnlyCount = computed(() => this.total() - this.assignedCount());

  constructor() {
    from(this.companiesService.list({ limit: 100 }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.companies.set(list.items);
          this.companiesLoading.set(false);
        },
        error: () => {
          this.companies.set([]);
          this.companiesLoading.set(false);
          this.companiesError.set(true);
        },
      });
  }

  /** Active jobs available for a company (empty until its jobs are loaded). */
  protected jobsFor(companyId: string | null): readonly JobGet[] {
    if (!companyId) {
      return [];
    }
    return this.jobsByCompany()[companyId] ?? [];
  }

  protected isJobsLoading(companyId: string | null): boolean {
    return companyId !== null && this.jobsLoading().has(companyId);
  }

  // --- Searchable company select --------------------------------------------

  protected readonly companyTypeLabels = COMPANY_TYPE_LABELS;
  /** Shared filter for whichever company panel is open (only one at a time). */
  protected readonly companySearch = signal('');

  protected readonly filteredCompanies = computed(() => {
    const query = this.companySearch().trim().toLowerCase();
    const all = this.companies();
    if (!query) {
      return all;
    }
    return all.filter((company) => company.company_name.toLowerCase().includes(query));
  });

  protected companyById(companyId: string | null): CompanyGet | undefined {
    return this.companies().find((company) => company.id === companyId);
  }

  protected onCompanySearch(event: Event): void {
    this.companySearch.set((event.target as HTMLInputElement).value);
  }

  /** Clear the filter when a panel closes so it reopens showing all companies. */
  protected onCompanyOpened(opened: boolean): void {
    if (!opened) {
      this.companySearch.set('');
    }
  }

  // --- Per-row field edits ---------------------------------------------------

  private patchRow(id: string, patch: Partial<ImportReviewRow>): void {
    this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  protected onGenderChange(id: string, value: string): void {
    this.patchRow(id, { gender: value });
  }

  protected onCivilStatusChange(id: string, value: string[]): void {
    this.patchRow(id, { civilStatus: value });
  }

  protected onAddressChange(id: string, value: string): void {
    this.patchRow(id, { address: value });
  }

  protected onStatusChange(id: string, value: string): void {
    this.patchRow(id, { status: value });
  }

  protected onCompanyChange(id: string, companyId: string): void {
    // Changing company invalidates the previously chosen vacancy.
    this.patchRow(id, { companyId, jobId: null });
    this.loadJobs(companyId);
  }

  protected onJobChange(id: string, jobId: string): void {
    this.patchRow(id, { jobId });
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

  // --- Bulk apply ------------------------------------------------------------

  protected onBulkCompanyChange(companyId: string): void {
    this.bulkCompanyId.set(companyId);
    this.bulkJobId.set(null);
    this.loadJobs(companyId);
  }

  protected applyToAll(): void {
    const companyId = this.bulkCompanyId();
    const jobId = this.bulkJobId();
    const status = this.bulkStatus();

    this.rows.update((rows) =>
      rows.map((row) => {
        const next = { ...row };
        if (companyId) {
          next.companyId = companyId;
          next.jobId = jobId ?? null;
        }
        if (status) {
          next.status = status;
        }
        return next;
      }),
    );
  }

  // --- Footer actions --------------------------------------------------------

  /** Save applicants, applying each row's job assignment (referral). */
  protected save(): void {
    void this.submit(true);
  }

  /** Save everyone as registered-only, dropping any job assignments. */
  protected skip(): void {
    void this.submit(false);
  }

  private async submit(assign: boolean): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    const items = this.rows().map((row) => toImportItem(row, assign));
    try {
      const result = await this.applicantsService.importApplicants({ items });
      const referredNote = result.referred > 0 ? ` · ${result.referred} referred` : '';
      this.snackBar.open(
        `Imported ${result.created} applicant${result.created === 1 ? '' : 's'}${referredNote}.`,
        'Dismiss',
        { duration: 5000 },
      );
      this.dialogRef.close(result);
    } catch {
      this.saving.set(false);
      this.snackBar.open('Could not import applicants. Please try again.', 'Dismiss', {
        duration: 6000,
      });
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private loadJobs(companyId: string): void {
    if (this.jobsByCompany()[companyId] || this.jobsLoading().has(companyId)) {
      return;
    }
    this.jobsLoading.update((set) => new Set(set).add(companyId));
    const done = () =>
      this.jobsLoading.update((set) => {
        const next = new Set(set);
        next.delete(companyId);
        return next;
      });
    from(this.jobsService.list({ company_id: companyId, status: 'active', limit: 100 }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.jobsByCompany.update((map) => ({ ...map, [companyId]: list.items }));
          done();
        },
        error: () => {
          this.jobsByCompany.update((map) => ({ ...map, [companyId]: [] }));
          done();
        },
      });
  }
}
