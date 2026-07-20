import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlacementsChartComponent } from './placements-chart/placements-chart.component';
import { MatchingFunnelComponent } from './matching-funnel/matching-funnel.component';
import { SeekersStatusComponent } from './seekers-status/seekers-status.component';
import { InDemandOccupationsComponent } from './in-demand-occupations/in-demand-occupations.component';
import { RecentApplicantsComponent } from './recent-applicants/recent-applicants.component';
import { TopHiringCompaniesComponent } from './top-hiring-companies/top-hiring-companies.component';
import {
  DashboardDateRange,
  DateRangeFilterComponent,
} from './date-range-filter/date-range-filter.component';

/** Visual tone applied to a KPI's icon tile. */
type KpiTone = 'green' | 'teal' | 'grey' | 'amber';

/** Trailing indicator shown beneath a KPI value. */
interface KpiDelta {
  text: string;
  /** `up` renders a highlighted trend pill; `neutral` renders a plain context pill. */
  trend: 'up' | 'neutral';
}

interface Kpi {
  icon: string;
  tone: KpiTone;
  value: string;
  label: string;
  delta: KpiDelta;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    MatIconModule,
    PlacementsChartComponent,
    MatchingFunnelComponent,
    SeekersStatusComponent,
    InDemandOccupationsComponent,
    RecentApplicantsComponent,
    TopHiringCompaniesComponent,
    DateRangeFilterComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  // TODO: replace the hard-coded name/metrics with data from the auth + stats stores.
  protected readonly userName = signal('Ernesto');

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  protected readonly monthLabel = computed(() =>
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  protected readonly kpis = signal<Kpi[]>([
    {
      icon: 'person',
      tone: 'green',
      value: '1,284',
      label: 'Registered job seekers',
      delta: { text: '8.2%', trend: 'up' },
    },
    {
      icon: 'work',
      tone: 'teal',
      value: '96',
      label: 'Active job listings',
      delta: { text: '5 new', trend: 'up' },
    },
    {
      icon: 'list',
      tone: 'grey',
      value: '412',
      label: 'Open vacancies',
      delta: { text: 'across 96 listings', trend: 'neutral' },
    },
    {
      icon: 'task_alt',
      tone: 'amber',
      value: '187',
      label: 'Placements (hired)',
      delta: { text: '12%', trend: 'up' },
    },
  ]);

  /** Currently selected filter range; defaults to the current month. */
  protected readonly selectedRange = signal<DashboardDateRange | null>(null);

  protected onRangeChange(range: DashboardDateRange): void {
    // TODO: refetch the dashboard metrics for `range` once the stats store is wired.
    this.selectedRange.set(range);
  }
}
