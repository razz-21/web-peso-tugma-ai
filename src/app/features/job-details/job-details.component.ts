import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { injectDispatch } from '@ngrx/signals/events';
import { JOB_STATUS_LABELS, JobGet } from '../../core/models/job.model';
import { COMPANY_TYPE_LABELS } from '../../core/models/company.model';
import { APP_ROUTES, companyDetailsRoute } from '../../core/constants/routes.constant';
import { JobDetailsStore } from '../../stores/job-details/job-details.store';
import { jobDetailsEvents } from '../../stores/job-details/job-details.events';
import { jobsEvents } from '../../stores/jobs/jobs.events';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { JobFormComponent } from '../../features/job-listings/job-form/job-form.component';

@Component({
  selector: 'app-job-details',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './job-details.component.html',
  styleUrl: './job-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [JobDetailsStore],
})
export class JobDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly statusLabels = JOB_STATUS_LABELS;
  protected readonly companyTypeLabels = COMPANY_TYPE_LABELS;
  protected readonly store = inject(JobDetailsStore);
  private readonly dispatch = injectDispatch(jobDetailsEvents);
  private readonly jobsDispatch = injectDispatch(jobsEvents);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly job = this.store.job;

  protected readonly companyLink = computed(() => {
    const company = this.job()?.company;
    return company ? companyDetailsRoute(company.id) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadJobDetails({ id });
    }
  }

  protected onBack(): void {
    this.router.navigate([APP_ROUTES.jobListings]);
  }

  protected onViewCompany(companyId: string): void {
    this.router.navigateByUrl(companyDetailsRoute(companyId));
  }

  protected onToggleStatus(job: JobGet): void {
    const closing = job.status === 'active';
    const status = closing ? 'closed' : 'active';

    const data: ConfirmDialogData = closing
      ? {
          title: 'Close job',
          message: `Close <strong>${job.title}</strong>? It will no longer be marked as active.`,
          confirmLabel: 'Close job',
          destructive: true,
        }
      : {
          title: 'Activate job',
          message: `Activate <strong>${job.title}</strong>? It will be marked as active again.`,
          confirmLabel: 'Activate job',
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
          this.dispatch.updateStatus({ id: job.id, status });
        }
      });
  }

  protected onEdit(job: JobGet): void {
    this.dialog
      .open<JobFormComponent, JobGet, JobGet>(JobFormComponent, {
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        panelClass: 'job-form-dialog',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: job,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dispatch.loadJobDetails({ id: job.id }));
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
          this.jobsDispatch.deleteJob(job.id);
          this.router.navigate([APP_ROUTES.jobListings]);
        }
      });
  }
}
