import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkspaceGet, WorkspaceStatistics } from '../../../core/models/workspace.model';
import { WorkspacesService } from '../../../core/services/workspaces.service';

interface StatCard {
  readonly label: string;
  readonly icon: string;
  readonly value: number;
}

/**
 * Statistics tab for a workspace. Loads aggregate counts (applicants, jobs,
 * companies, recommended jobs) scoped to this workspace on activation.
 */
@Component({
  selector: 'app-workspace-statistics',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './workspace-statistics.component.html',
  styleUrl: './workspace-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceStatisticsComponent implements OnInit {
  private readonly workspacesService = inject(WorkspacesService);

  readonly workspace = input.required<WorkspaceGet>();

  protected readonly statistics = signal<WorkspaceStatistics | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly cards = computed<StatCard[]>(() => {
    const stats = this.statistics();
    if (stats === null) {
      return [];
    }
    return [
      { label: 'Total applicants', icon: 'group', value: stats.total_applicants },
      { label: 'Total jobs', icon: 'work', value: stats.total_jobs },
      { label: 'Total companies', icon: 'business', value: stats.total_companies },
      {
        label: 'Total recommended jobs',
        icon: 'auto_awesome',
        value: stats.total_recommended_jobs,
      },
    ];
  });

  ngOnInit(): void {
    void this.loadStatistics();
  }

  private async loadStatistics(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.statistics.set(await this.workspacesService.statistics(this.workspace().id));
    } catch {
      this.statistics.set(null);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
