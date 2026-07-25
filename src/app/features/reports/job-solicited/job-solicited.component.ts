import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import {
  JobSolicitedReport,
  JobSolicitedRow,
  ReportRangeParams,
} from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import { MonthlyBarChartComponent } from '../../../core/components/monthly-bar-chart/monthly-bar-chart.component';
import {
  ReportTableColumn,
  ReportTableComponent,
  ReportTableRow,
} from '../../../core/components/report-table/report-table.component';
import { monthlyRangeLabel, toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** Render the value at a smaller size — for long text values like an occupation. */
  compact?: boolean;
  /** A trend badge (e.g. "+12 vs previous period"); mutually exclusive with `subtext`. */
  delta?: { text: string; positive: boolean };
  /** Secondary line beneath the value (e.g. "42 vacancies"). */
  subtext?: string;
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');
const EM_DASH = '—';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'job_title', label: 'Job Title' },
  { key: 'no_of_vacancies', label: 'No. of Vacancies' },
  { key: 'age_range', label: 'Age' },
  { key: 'sex', label: 'Sex' },
  { key: 'civil_status', label: 'Civil Status' },
  { key: 'educational_attainment', label: 'Educational Attainments' },
  { key: 'course_program', label: 'Course/Program', wrap: true },
  { key: 'company', label: 'Company' },
  { key: 'salary_per_month', label: 'Salary per Month' },
];

const toTableRow = (row: JobSolicitedRow): ReportTableRow => ({
  job_title: row.job_title,
  no_of_vacancies: row.no_of_vacancies.toLocaleString('en-US'),
  age_range: row.age_range ?? EM_DASH,
  sex: row.sex ?? EM_DASH,
  civil_status: row.civil_status.length ? row.civil_status.join(', ') : EM_DASH,
  educational_attainment: row.educational_attainment.length
    ? row.educational_attainment.join(', ')
    : EM_DASH,
  course_program: row.course_program ?? EM_DASH,
  company: row.company ?? EM_DASH,
  salary_per_month:
    row.salary_per_month === null ? EM_DASH : `₱${row.salary_per_month.toLocaleString('en-US')}`,
});

@Component({
  selector: 'app-job-solicited',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    MonthlyBarChartComponent,
    PeriodFilterComponent,
    ReportTableComponent,
  ],
  templateUrl: './job-solicited.component.html',
  styleUrls: ['./job-solicited.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobSolicitedComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<JobSolicitedReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3];

  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableRows = computed<ReportTableRow[]>(
    () => this.report()?.rows.map(toTableRow) ?? [],
  );
  protected readonly tableFileName = computed(() => {
    const report = this.report();
    return report ? `job-solicited-${report.start_date}-to-${report.end_date}` : 'job-solicited';
  });

  /** Summary cards derived from the report; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    const { vacancies_solicited, establishments_engaged, avg_per_establishment, top_occupation } =
      report;
    return [
      {
        icon: 'work',
        tone: 'green',
        label: 'Vacancies solicited',
        value: formatNumber(vacancies_solicited.value),
        delta:
          vacancies_solicited.change === null
            ? undefined
            : {
                text: `${vacancies_solicited.change >= 0 ? '+' : ''}${vacancies_solicited.change} vs previous period`,
                positive: vacancies_solicited.change >= 0,
              },
      },
      {
        icon: 'apartment',
        tone: 'amber',
        label: 'Establishments engaged',
        value: formatNumber(establishments_engaged),
      },
      {
        icon: 'insights',
        tone: 'teal',
        label: 'Avg per establishment',
        value: avg_per_establishment.toLocaleString('en-US', { minimumFractionDigits: 1 }),
      },
      {
        icon: 'emoji_events',
        tone: 'grey',
        label: 'Top occupation',
        value: top_occupation.occupation ?? '—',
        compact: true,
        subtext: `${formatNumber(top_occupation.vacancies)} vacancies`,
      },
    ];
  });

  /** The chart's month span, e.g. "Jan – Dec 2026". */
  protected readonly chartRangeLabel = computed(() => monthlyRangeLabel(this.report()?.monthly));

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
      this.report.set(await this.reportsService.jobSolicited(params));
    } catch {
      this.snackBar.open('Failed to load the Job Solicited report.', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }
}
