import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { injectDispatch } from '@ngrx/signals/events';
import { CompanyGet } from '../../../core/models/company.model';
import { JobGet } from '../../../core/models/job.model';
import { CompanyDetailsStore } from '../../../stores/company-details/company-details.store';
import { companyDetailsEvents } from '../../../stores/company-details/company-details.events';
import { JobFormComponent, JobFormData } from '../../job-listings/job-form/job-form.component';
import { ImportJobsComponent } from '../../job-listings/import-jobs/import-jobs.component';
import {
  ImportJobReviewComponent,
  ImportJobReviewData,
} from '../../job-listings/import-jobs/import-job-review.component';
import {
  readImportRows,
  toJobReviewRows,
} from '../../job-listings/import-jobs/import-job-review.model';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-jobs',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
  ],
  templateUrl: './company-jobs.component.html',
  styleUrl: './company-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyJobsComponent {
  /** The company whose jobs are listed; used to lock the company on create/edit. */
  readonly company = input.required<CompanyGet>();

  /**
   * Whether the current user may delete a job. Only admins / super admins
   * qualify — officers never see the delete action. Mirrored by the backend,
   * which rejects the delete for other roles with a 403.
   */
  readonly canDelete = input<boolean>(false);

  /** Emitted when a job row is activated, to open the job details drawer. */
  readonly viewJob = output<JobGet>();

  // The job list and its actions live in CompanyDetailsStore (loaded, kept in
  // sync, and deletes handled there).
  private readonly store = inject(CompanyDetailsStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dispatch = injectDispatch(companyDetailsEvents);

  protected readonly loading = this.store.jobsLoading;
  protected readonly search = signal('');

  /** Disable delete buttons while a delete is in flight. */
  protected readonly deleting = this.store.deleteJobLoading;

  /** Jobs matching the search box, filtered client-side by title. */
  protected readonly filteredJobs = computed(() => {
    const query = this.search().trim().toLowerCase();
    const jobs = this.store.jobs();
    if (!query) {
      return jobs;
    }
    return jobs.filter((job) => job.title.toLowerCase().includes(query));
  });

  /** Empty-state title when a search yields no matches. */
  protected readonly noMatchTitle = computed(() => `No jobs match "${this.search().trim()}"`);

  protected readonly displayedColumns = [
    'title',
    'vacancies',
    'education',
    'salary',
    'created_at',
    'actions',
  ] as const;

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onCreate(): void {
    this.openForm({ lockedCompany: this.company() });
  }

  protected onImport(): void {
    const dialogRef = this.dialog.open<ImportJobsComponent, unknown, File>(ImportJobsComponent, {
      panelClass: 'import-jobs-dialog',
      width: '640px',
      maxWidth: '92vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Import jobs',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file) => {
        if (file) {
          void this.openReview(file);
        }
      });
  }

  private async openReview(file: File): Promise<void> {
    let rows;
    try {
      rows = toJobReviewRows(await readImportRows(file));
    } catch {
      this.snackBar.open('Could not read the import file.', 'Dismiss', { duration: 5000 });
      return;
    }

    if (rows.length === 0) {
      this.snackBar.open('No jobs found. Fill in the template before importing.', 'Dismiss', {
        duration: 6000,
      });
      return;
    }

    const company = this.company();
    const reviewRef = this.dialog.open<ImportJobReviewComponent, ImportJobReviewData>(
      ImportJobReviewComponent,
      {
        panelClass: 'import-job-review-dialog',
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Review imported jobs',
        data: {
          companyId: company.id,
          companyName: company.company_name,
          rows,
          // Existing titles so the review can flag/skip duplicates for this company.
          existingTitles: this.store.jobs().map((job) => job.title),
        },
      },
    );

    reviewRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          // Jobs were created by the review dialog — refresh this company's list.
          this.dispatch.loadCompanyJobs({ companyId: company.id });
        }
      });
  }

  protected onEdit(job: JobGet): void {
    this.openForm({ job, lockedCompany: this.company() });
  }

  private openForm(data: JobFormData): void {
    this.dialog.open<JobFormComponent, JobFormData, JobGet>(JobFormComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'job-form-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data,
    });
  }

  protected onDelete(job: JobGet): void {
    // Defense in depth: the button is hidden for officers and the backend
    // enforces the role, but guard here too in case the handler is reached.
    if (!this.canDelete()) {
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Delete job',
      message: `Are you sure you want to delete <strong>${job.title}</strong>? This action cannot be undone.`,
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
          this.dispatch.deleteCompanyJob({ id: job.id });
        }
      });
  }
}
