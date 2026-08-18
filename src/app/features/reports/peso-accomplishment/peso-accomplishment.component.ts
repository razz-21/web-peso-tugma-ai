import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { PesoAccomplishmentReport, ReportRangeParams } from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import {
  MonthlyBarChartComponent,
  MonthlyBarPoint,
} from '../../../core/components/monthly-bar-chart/monthly-bar-chart.component';
import {
  ReportTableColumn,
  ReportTableComponent,
  ReportTableRow,
} from '../../../core/components/report-table/report-table.component';
import { toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Format a percentage (0–100) to one decimal, e.g. `42.5%`. */
const formatPercent = (value: number): string =>
  `${(Math.round(value * 10) / 10).toLocaleString('en-US')}%`;

/** Share of registered job seekers who were placed, as a percentage (0 when none registered). */
const employmentRate = (placed: number, registered: number): number =>
  registered > 0 ? (placed / registered) * 100 : 0;

/** Render a `Jul 15, 2026` date from an ISO/`YYYY-MM-DD` string; empty when invalid. */
const formatDay = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const INDICATOR_COLUMNS: ReportTableColumn[] = [
  { key: 'indicator', label: 'Indicator' },
  { key: 'value', label: 'This Period' },
];

@Component({
  selector: 'app-peso-accomplishment',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    MonthlyBarChartComponent,
    PeriodFilterComponent,
    ReportTableComponent,
  ],
  templateUrl: './peso-accomplishment.component.html',
  styleUrls: ['./peso-accomplishment.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PesoAccomplishmentComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<PesoAccomplishmentReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3, 4];

  protected readonly indicatorColumns = INDICATOR_COLUMNS;

  /** The four headline metrics, shown as cards; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    return [
      {
        icon: 'person_add',
        tone: 'teal',
        label: 'Job seekers registered',
        value: formatNumber(report.job_seekers_registered),
      },
      {
        icon: 'work',
        tone: 'green',
        label: 'Vacancies solicited',
        value: formatNumber(report.vacancies_solicited),
      },
      {
        icon: 'send',
        tone: 'amber',
        label: 'Applicants referred',
        value: formatNumber(report.applicants_referred),
      },
      {
        icon: 'check_box',
        tone: 'grey',
        label: 'Applicants placed',
        value: formatNumber(report.applicants_placed),
      },
      {
        icon: 'trending_up',
        tone: 'green',
        label: 'Employment rate',
        value: formatPercent(
          employmentRate(report.applicants_placed, report.job_seekers_registered),
        ),
      },
    ];
  });

  /** The employment-facilitation funnel bars: Registered → Solicited → Referred → Placed. */
  protected readonly chartPoints = computed<MonthlyBarPoint[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { label: 'Registered', count: report.job_seekers_registered },
      { label: 'Solicited', count: report.vacancies_solicited },
      { label: 'Referred', count: report.applicants_referred },
      { label: 'Placed', count: report.applicants_placed },
    ];
  });

  /** A readable y-axis grid step for the funnel bars, scaled to the tallest bar. */
  protected readonly chartAxisStep = computed(() => {
    const peak = Math.max(0, ...this.chartPoints().map((point) => point.count));
    if (peak <= 50) return 10;
    if (peak <= 200) return 50;
    if (peak <= 500) return 100;
    if (peak <= 2000) return 200;
    return 500;
  });

  /** The accomplishment summary rows (indicator + this-period value). */
  protected readonly indicatorRows = computed<ReportTableRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { indicator: 'Job seekers registered', value: formatNumber(report.job_seekers_registered) },
      { indicator: 'Establishments engaged', value: formatNumber(report.establishments_engaged) },
      { indicator: 'Vacancies solicited', value: formatNumber(report.vacancies_solicited) },
      { indicator: 'Applicants referred', value: formatNumber(report.applicants_referred) },
      { indicator: 'Applicants placed', value: formatNumber(report.applicants_placed) },
      { indicator: 'Placement rate', value: `${report.placement_rate}%` },
    ];
  });

  protected readonly periodLabel = computed(() => {
    const report = this.report();
    if (!report) return '';
    return `${formatDay(report.start_date)} – ${formatDay(report.end_date)}`;
  });

  protected readonly tableFileName = computed(() => {
    const report = this.report();
    return report
      ? `peso-accomplishment-${report.start_date}-to-${report.end_date}`
      : 'peso-accomplishment';
  });

  protected onPeriodChange(range: DateRangeSelection): void {
    const params: ReportRangeParams = {
      start_date: toIsoDate(range.start),
      end_date: toIsoDate(range.end),
    };
    void this.load(params);
  }

  private async load(params: ReportRangeParams): Promise<void> {
    this.loading.set(true);
    try {
      this.report.set(await this.reportsService.pesoAccomplishment(params));
    } catch {
      this.snackBar.open('Failed to load the PESO Accomplishment report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
