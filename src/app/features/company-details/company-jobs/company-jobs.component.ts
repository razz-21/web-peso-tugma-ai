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
import { injectDispatch } from '@ngrx/signals/events';
import { CompanyGet } from '../../../core/models/company.model';
import { JobGet } from '../../../core/models/job.model';
import { CompanyDetailsStore } from '../../../stores/company-details/company-details.store';
import { companyDetailsEvents } from '../../../stores/company-details/company-details.events';
import { JobFormComponent, JobFormData } from '../../job-listings/job-form/job-form.component';
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
  ],
  templateUrl: './company-jobs.component.html',
  styleUrl: './company-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyJobsComponent {
  /** The company whose jobs are listed; used to lock the company on create/edit. */
  readonly company = input.required<CompanyGet>();

  /** Emitted when a job row is activated, to open the job details drawer. */
  readonly viewJob = output<JobGet>();

  // The job list and its actions live in CompanyDetailsStore (loaded, kept in
  // sync, and deletes handled there).
  private readonly store = inject(CompanyDetailsStore);
  private readonly dialog = inject(MatDialog);
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
