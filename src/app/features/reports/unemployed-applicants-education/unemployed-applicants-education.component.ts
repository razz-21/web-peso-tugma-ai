import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { ReportRangeParams, UnemployedByEducationReport } from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import {
  HorizontalBarChartComponent,
  HorizontalBarPoint,
} from '../../../core/components/horizontal-bar-chart/horizontal-bar-chart.component';
import {
  MonthlyBarChartComponent,
  MonthlyBarPoint,
} from '../../../core/components/monthly-bar-chart/monthly-bar-chart.component';
import { toIsoDate } from '../report-utils';

/** One row of the course-breakdown table: rank, course, count, and its share of
 *  the degree-holding unemployed. */
interface CourseBreakdownRow {
  rank: number;
  label: string;
  count: number;
  sharePct: number;
}

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** Render the value at a smaller size — for long text values like a course. */
  compact?: boolean;
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');
const EM_DASH = '—';

// The top three courses read darker to anchor the ranking; the rest sit in a
// lighter tint (mirrors the report design).
const TOP_BAR_COLOR = '#43681f';
const REST_BAR_COLOR = '#8fbc6b';

@Component({
  selector: 'app-unemployed-applicants-education',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    HorizontalBarChartComponent,
    MonthlyBarChartComponent,
    PeriodFilterComponent,
  ],
  templateUrl: './unemployed-applicants-education.component.html',
  styleUrls: ['./unemployed-applicants-education.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnemployedApplicantsEducationComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<UnemployedByEducationReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2];

  /** Summary cards derived from the report; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    return [
      {
        icon: 'group',
        tone: 'green',
        label: 'Total unemployed',
        value: formatNumber(report.total_unemployed),
      },
      {
        icon: 'school',
        tone: 'teal',
        label: 'Most common course',
        value: report.most_common_course ?? EM_DASH,
        compact: true,
      },
      {
        icon: 'workspace_premium',
        tone: 'amber',
        label: 'Unemployed college graduates',
        value: formatNumber(report.college_graduates),
      },
    ];
  });

  /** Bars for the "Top courses" chart, in the ranking order returned by the API. */
  protected readonly chartPoints = computed<HorizontalBarPoint[]>(
    () => this.report()?.top_courses.map((course) => ({ ...course })) ?? [],
  );

  /** Per-bar colours: the top three courses darker, the rest lighter. */
  protected readonly chartColors = computed<string[]>(() =>
    (this.report()?.top_courses ?? []).map((_, index) =>
      index < 3 ? TOP_BAR_COLOR : REST_BAR_COLOR,
    ),
  );

  /** Bars for the "Unemployed by education level" attainment chart. */
  protected readonly educationPoints = computed<MonthlyBarPoint[]>(
    () => this.report()?.by_education_level.map((level) => ({ ...level })) ?? [],
  );

  /** Full course ranking with each course's share of the degree-holding
   *  unemployed, plus an aggregated "Other courses" row for the remainder. */
  protected readonly courseRows = computed<CourseBreakdownRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    const denominator = report.with_course;
    const share = (count: number): number =>
      denominator > 0 ? Math.round((count / denominator) * 100) : 0;

    const rows: CourseBreakdownRow[] = report.top_courses.map((course, index) => ({
      rank: index + 1,
      label: course.label,
      count: course.count,
      sharePct: share(course.count),
    }));

    const ranked = report.top_courses.reduce((sum, course) => sum + course.count, 0);
    const other = denominator - ranked;
    if (other > 0) {
      rows.push({
        rank: rows.length + 1,
        label: 'Other courses',
        count: other,
        sharePct: share(other),
      });
    }
    return rows;
  });

  protected format(value: number): string {
    return formatNumber(value);
  }

  protected roundPct(value: number): string {
    return `${Math.round(value)}%`;
  }

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
      this.report.set(await this.reportsService.unemployedByEducation(params));
    } catch {
      this.snackBar.open('Failed to load the Unemployed Applicants by Education report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
