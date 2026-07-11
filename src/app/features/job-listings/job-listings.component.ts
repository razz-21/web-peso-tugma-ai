import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { JobGet } from '../../core/models/job.model';
import { jobDetailsRoute } from '../../core/constants/routes.constant';
import { JobsStore } from '../../stores/jobs/jobs.store';
import { jobsEvents } from '../../stores/jobs/jobs.events';
import { JobsTableComponent } from './jobs-table/jobs-table.component';
import { JobFormComponent, JobFormData } from './job-form/job-form.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-job-listings',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    JobsTableComponent,
  ],
  templateUrl: './job-listings.component.html',
  styleUrl: './job-listings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobListingsComponent implements OnInit {
  protected readonly store = inject(JobsStore);
  private readonly dispatch = injectDispatch(jobsEvents);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly pageSizeOptions = [10, 25, 50] as const;

  public ngOnInit(): void {
    this.dispatch.loadJob({ q: '', pageIndex: 0, pageSize: 10 });
  }

  protected onSearch(event: Event): void {
    this.dispatch.searchJob((event.target as HTMLInputElement).value);
  }

  protected onPage(event: PageEvent): void {
    this.dispatch.loadJob({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      q: this.store.filter.q(),
    });
  }

  protected onView(job: JobGet): void {
    this.router.navigateByUrl(jobDetailsRoute(job.id));
  }

  protected onAddJob(): void {
    this.dialog.open<JobFormComponent, JobFormData, JobGet>(JobFormComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'job-form-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: {},
    });
  }

  protected onEdit(job: JobGet): void {
    this.dialog.open<JobFormComponent, JobFormData, JobGet>(JobFormComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'job-form-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: { job },
    });
  }

  protected onDelete(job: JobGet): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data: {
          title: 'Delete job',
          message: `Are you sure you want to delete <strong>${job.title}</strong>? This action cannot be undone.`,
          confirmLabel: 'Delete',
          destructive: true,
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dispatch.deleteJob(job.id);
        }
      });
  }
}
