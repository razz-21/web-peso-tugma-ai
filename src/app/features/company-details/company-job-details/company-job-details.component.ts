import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { JOB_STATUS_LABELS, JobGet } from '../../../core/models/job.model';
import { jobDetailsRoute } from '../../../core/constants/routes.constant';

/**
 * Job details shown in the company page's side drawer: a sticky header, the
 * scrollable details, and a sticky action footer. Actions are emitted so the
 * page (which owns the dialogs) handles them.
 */
@Component({
  selector: 'app-company-job-details',
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './company-job-details.component.html',
  styleUrl: './company-job-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyJobDetailsComponent {
  readonly job = input.required<JobGet>();
  /** Whether the current user may delete the job (admins / super admins only). */
  readonly canDelete = input(false);
  /** Disables the status toggle while an update is in flight. */
  readonly updating = input(false);

  readonly closed = output<void>();
  readonly edit = output<JobGet>();
  readonly toggleStatus = output<JobGet>();
  readonly delete = output<JobGet>();

  protected readonly statusLabels = JOB_STATUS_LABELS;

  protected readonly jobLink = computed(() => jobDetailsRoute(this.job().id));
  protected readonly educationLabel = computed(() =>
    this.job().minimum_education_attainment.join(', '),
  );
  protected readonly civilStatusLabel = computed(() => this.job().civil_status.join(', '));
  /** Spaced-out sex preference, e.g. `Female/Male` → `Female / Male`. */
  protected readonly sexLabel = computed(() => this.job().sex?.replace('/', ' / ') ?? '');
}
