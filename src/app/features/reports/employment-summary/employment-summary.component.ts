import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import {
  DonutChartComponent,
  DonutSegment,
} from '../../../core/components/donut-chart/donut-chart.component';
import {
  MonthlyBarChartComponent,
  MonthlyBarPoint,
} from '../../../core/components/monthly-bar-chart/monthly-bar-chart.component';
import { EmploymentSummaryReport, ReportRangeParams } from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import { toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** A trend badge (e.g. "+10.9%") vs the previous period; hidden when null. */
  delta?: { text: string; positive: boolean };
}

/** One legend row under a donut: coloured dot, label, count, and share. */
interface LegendRow {
  label: string;
  color: string;
  count: string;
  percent: string;
}

/** One row of the Top 10 job vacancies table, pre-formatted for display. */
interface VacancyRow {
  jobTitle: string;
  company: string;
  /** Company logo (data URL / image URL); `null` renders initials instead. */
  avatar: string | null;
  vacancies: string;
  location: string;
}

const EM_DASH = '—';

// Ring colours, shared between each donut and its legend dots.
const COLOR_EMPLOYED = '#c2992e';
const COLOR_UNEMPLOYED = '#43681f';
const COLOR_PLACED = '#5f8f2f';
const COLOR_TRACK = '#e2e6db';
const COLOR_MALE = '#2f6d6a';
const COLOR_FEMALE = '#c2992e';

const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Signed percentage badge, e.g. `+10.9%` / `-4.2%`. */
const formatDeltaPct = (pct: number): string =>
  `${pct >= 0 ? '+' : ''}${pct.toLocaleString('en-US')}%`;

/** Whole-percent share of `value` within `total` (0 when empty). */
const share = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const toDelta = (metric: { change_pct: number | null }): StatCard['delta'] =>
  metric.change_pct === null
    ? undefined
    : { text: formatDeltaPct(metric.change_pct), positive: metric.change_pct >= 0 };

@Component({
  selector: 'app-employment-summary',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    AvatarComponent,
    DonutChartComponent,
    MonthlyBarChartComponent,
    PeriodFilterComponent,
  ],
  templateUrl: './employment-summary.component.html',
  styleUrls: ['./employment-summary.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmploymentSummaryComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<EmploymentSummaryReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2];

  /** The three headline metrics, shown as cards; `null` until the first load. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    return [
      {
        icon: 'work',
        tone: 'green',
        label: 'Vacancies solicited',
        value: formatNumber(report.vacancies_solicited.value),
        delta: toDelta(report.vacancies_solicited),
      },
      {
        icon: 'person_add',
        tone: 'teal',
        label: 'Registered applicants',
        value: formatNumber(report.registered_applicants.value),
        delta: toDelta(report.registered_applicants),
      },
      {
        icon: 'check_box',
        tone: 'amber',
        label: 'Placed applicants',
        value: formatNumber(report.placed_applicants.value),
        delta: toDelta(report.placed_applicants),
      },
    ];
  });

  // --- Employment status (registered cohort) ---
  protected readonly employmentSegments = computed<DonutSegment[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { label: 'Employed', value: report.employed, color: COLOR_EMPLOYED },
      { label: 'Unemployed', value: report.unemployed, color: COLOR_UNEMPLOYED },
    ];
  });
  protected readonly employmentCenter = computed(() =>
    formatNumber(this.report()?.registered_total ?? 0),
  );
  protected readonly employmentLegend = computed<LegendRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    const total = report.registered_total;
    return [
      {
        label: 'Employed',
        color: COLOR_EMPLOYED,
        count: formatNumber(report.employed),
        percent: `${share(report.employed, total)}%`,
      },
      {
        label: 'Unemployed',
        color: COLOR_UNEMPLOYED,
        count: formatNumber(report.unemployed),
        percent: `${share(report.unemployed, total)}%`,
      },
    ];
  });

  // --- Placement rate ---
  protected readonly placementSegments = computed<DonutSegment[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { label: 'Placed', value: report.placed, color: COLOR_PLACED },
      {
        label: 'Not placed',
        value: Math.max(0, report.referred - report.placed),
        color: COLOR_TRACK,
      },
    ];
  });
  protected readonly placementCenter = computed(() => {
    const report = this.report();
    return report ? `${report.placement_rate.toLocaleString('en-US')}%` : '';
  });
  protected readonly referredValue = computed(() => formatNumber(this.report()?.referred ?? 0));
  protected readonly placedValue = computed(() => formatNumber(this.report()?.placed ?? 0));

  // --- Unemployed applicants by gender ---
  protected readonly genderSegments = computed<DonutSegment[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { label: 'Male', value: report.unemployed_male, color: COLOR_MALE },
      { label: 'Female', value: report.unemployed_female, color: COLOR_FEMALE },
    ];
  });
  protected readonly genderCenter = computed(() => formatNumber(this.report()?.unemployed ?? 0));
  protected readonly genderLegend = computed<LegendRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    const total = report.unemployed;
    return [
      {
        label: 'Male',
        color: COLOR_MALE,
        count: formatNumber(report.unemployed_male),
        percent: `${share(report.unemployed_male, total)}%`,
      },
      {
        label: 'Female',
        color: COLOR_FEMALE,
        count: formatNumber(report.unemployed_female),
        percent: `${share(report.unemployed_female, total)}%`,
      },
    ];
  });

  // --- Applicants by status (Registered → Referred → Placed) ---
  protected readonly statusPoints = computed<MonthlyBarPoint[]>(() => {
    const report = this.report();
    if (!report) return [];
    return [
      { label: 'Registered', count: report.registered_total },
      { label: 'Referred', count: report.referred },
      { label: 'Placed', count: report.placed },
    ];
  });
  protected readonly statusColors = [COLOR_UNEMPLOYED, COLOR_MALE, COLOR_EMPLOYED];
  /** A readable y-axis grid step, scaled to the tallest bar. */
  protected readonly statusAxisStep = computed(() => {
    const peak = Math.max(0, ...this.statusPoints().map((point) => point.count));
    if (peak <= 50) return 10;
    if (peak <= 200) return 50;
    if (peak <= 500) return 100;
    if (peak <= 2000) return 200;
    return 500;
  });
  protected readonly referredOfRegisteredPct = computed(() => {
    const report = this.report();
    return report ? `${share(report.referred, report.registered_total)}%` : '';
  });
  protected readonly placedOfReferredPct = computed(() => {
    const report = this.report();
    return report ? `${share(report.placed, report.referred)}%` : '';
  });

  // --- Top 10 job vacancies (current open listings) ---
  protected readonly topVacancies = computed<VacancyRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    return report.top_vacancies.map((row) => ({
      jobTitle: row.job_title,
      company: row.company ?? EM_DASH,
      avatar: row.company_avatar,
      vacancies: formatNumber(row.vacancies),
      location: row.location ?? EM_DASH,
    }));
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
      this.report.set(await this.reportsService.employmentSummary(params));
    } catch {
      this.snackBar.open('Failed to load the Employment Summary report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
