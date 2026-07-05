import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CompanyJob, JOB_STATUS_LABELS, MOCK_COMPANY_JOBS } from '../company-jobs.mock';

@Component({
  selector: 'app-company-jobs',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule],
  templateUrl: './company-jobs.component.html',
  styleUrl: './company-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyJobsComponent {
  /** Emitted when a job row is activated, to open the job details drawer. */
  readonly viewJob = output<CompanyJob>();

  protected readonly jobs = MOCK_COMPANY_JOBS.map((job) => ({
    ...job,
    statusLabel: JOB_STATUS_LABELS[job.status],
  }));
  protected readonly displayedColumns = [
    'title',
    'description',
    'location',
    'vacancies',
    'status',
  ] as const;

  protected readonly search = signal('');

  /** Jobs matching the search box, filtered across title, description, and location. */
  protected readonly filteredJobs = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.jobs;
    }
    return this.jobs.filter((job) =>
      [job.title, job.description, job.location].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
