import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { JOB_STATUS_LABELS, JobGet } from '../../../core/models/job.model';

/** Read-only panel that renders every detail of a job, shown in the drawer. */
@Component({
  selector: 'app-company-job-details',
  imports: [DatePipe, DecimalPipe, MatIconModule],
  templateUrl: './company-job-details.component.html',
  styleUrl: './company-job-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyJobDetailsComponent {
  readonly job = input.required<JobGet>();

  protected readonly statusLabels = JOB_STATUS_LABELS;
}
