import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { SkeletonComponent } from '../../core/components/skeleton/skeleton.component';
import { DashboardRangeParams } from '../../core/models/dashboard.model';
import { DashboardStore } from '../../stores/dashboard/dashboard.store';
import { dashboardEvents } from '../../stores/dashboard/dashboard.events';
import { PlacementsChartComponent } from './placements-chart/placements-chart.component';
import { MatchingFunnelComponent } from './matching-funnel/matching-funnel.component';
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

const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Growth badge for the trend cards; `null` change_pct has no baseline to show. */
const percentDelta = (changePct: number | null): KpiDelta =>
  changePct === null
    ? { text: '—', trend: 'neutral' }
    : { text: `${changePct}%`, trend: changePct >= 0 ? 'up' : 'neutral' };

/** Format a Date as a local `YYYY-MM-DD` (avoids the UTC shift of toISOString). */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Component({
  selector: 'app-dashboard',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    PlacementsChartComponent,
    MatchingFunnelComponent,
    RecentApplicantsComponent,
    TopHiringCompaniesComponent,
    DateRangeFilterComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(DashboardStore);
  private readonly dispatch = injectDispatch(dashboardEvents);

  // TODO: replace the hard-coded name with the authenticated user (auth store).
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

  /** KPI cards derived from the summary; `null` until the first load resolves. */
  protected readonly kpis = computed<Kpi[] | null>(() => {
    const summary = this.store.summary();
    if (!summary) return null;
    return [
      {
        icon: 'person',
        tone: 'green',
        value: formatNumber(summary.registered_job_seekers.value),
        label: 'Registered job seekers',
        delta: percentDelta(summary.registered_job_seekers.change_pct),
      },
      {
        icon: 'work',
        tone: 'teal',
        value: formatNumber(summary.active_job_listings.value),
        label: 'Active job listings',
        delta: {
          text: `${summary.active_job_listings.new} new`,
          trend: summary.active_job_listings.new > 0 ? 'up' : 'neutral',
        },
      },
      {
        icon: 'list',
        tone: 'grey',
        value: formatNumber(summary.open_vacancies.value),
        label: 'Open vacancies',
        delta: {
          text: `across ${formatNumber(summary.open_vacancies.listings)} listings`,
          trend: 'neutral',
        },
      },
      {
        icon: 'task_alt',
        tone: 'amber',
        value: formatNumber(summary.placements.value),
        label: 'Placements (hired)',
        delta: percentDelta(summary.placements.change_pct),
      },
    ];
  });

  /** Placeholder rows while content loads (drive skeleton `@for` loops). */
  protected readonly kpiPlaceholders = [0, 1, 2, 3];
  protected readonly listPlaceholders = [0, 1, 2, 3, 4];

  protected readonly matchesLabel = computed(() => {
    const funnel = this.store.funnel();
    return funnel ? `${formatNumber(funnel.matches_generated)} matches generated` : '';
  });

  protected readonly placementRateLabel = computed(() => {
    const funnel = this.store.funnel();
    return funnel ? `${funnel.placement_rate}%` : '';
  });

  public ngOnInit(): void {
    // Initial load uses the backend's default window (trailing 30 days).
    this.dispatch.load(undefined);
  }

  protected onRangeChange(range: DashboardDateRange): void {
    const params: DashboardRangeParams = {
      start_date: toIsoDate(range.start),
      end_date: toIsoDate(range.end),
    };
    this.dispatch.load(params);
  }
}
