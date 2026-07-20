import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JOB_STATUS_LABELS, JobGet, JobStatus } from '../../../core/models/job.model';
import { JobsStore } from '../../../stores/jobs/jobs.store';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';

interface JobRow {
  job: JobGet;
  companyName: string;
  statusLabel: string;
  statusClass: string;
}

const STATUS_CLASS: Record<JobStatus, string> = {
  active: 'jobs-table__status--active',
  closed: 'jobs-table__status--closed',
};

@Component({
  selector: 'app-jobs-table',
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './jobs-table.component.html',
  styleUrl: './jobs-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsTableComponent {
  private readonly jobsStore = inject(JobsStore);

  readonly view = output<JobGet>();
  readonly edit = output<JobGet>();
  readonly delete = output<JobGet>();

  protected readonly jobs = computed(() => this.jobsStore.jobs());
  protected readonly loading = computed(() => this.jobsStore.loading());

  protected readonly rows = computed<JobRow[]>(() =>
    this.jobs().map((job) => ({
      job,
      companyName: job.company?.company_name ?? '—',
      statusLabel: JOB_STATUS_LABELS[job.status],
      statusClass: STATUS_CLASS[job.status],
    })),
  );

  protected readonly displayedColumns = [
    'title',
    'company',
    'vacancies',
    'salary',
    'status',
    'created_at',
    'actions',
  ] as const;
}
