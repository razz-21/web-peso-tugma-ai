import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import {
  ApplicantRegisteredReport,
  ApplicantRegisteredRow,
  ReportRangeParams,
} from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import { MonthlyAreaChartComponent } from '../../../core/components/monthly-area-chart/monthly-area-chart.component';
import {
  ReportTableColumn,
  ReportTableComponent,
  ReportTableRow,
} from '../../../core/components/report-table/report-table.component';
import { formatReferralDate, monthlyRangeLabel, toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** A trend badge (e.g. "+8.2% vs previous period"). */
  delta?: { text: string; positive: boolean };
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');
const EM_DASH = '—';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'sex', label: 'Sex' },
  { key: 'education', label: 'Educational Background', wrap: true },
  { key: 'course_program', label: 'Course/Program', wrap: true },
  { key: 'school_university', label: 'School/University', wrap: true },
  { key: 'desired_roles', label: 'Desired Role', wrap: true, maxWidth: '30rem' },
  { key: 'registered', label: 'Registered' },
  { key: 'status', label: 'Status' },
];

const toTableRow = (row: ApplicantRegisteredRow): ReportTableRow => ({
  name: row.name ?? EM_DASH,
  age: row.age === null ? EM_DASH : String(row.age),
  sex: row.sex ?? EM_DASH,
  education: row.education ?? EM_DASH,
  course_program: row.course_program ?? EM_DASH,
  school_university: row.school_university ?? EM_DASH,
  desired_roles: row.desired_roles.length ? row.desired_roles.join(', ') : EM_DASH,
  registered: formatReferralDate(row.registered),
  status: row.status,
});

@Component({
  selector: 'app-applicant-registered',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    MonthlyAreaChartComponent,
    PeriodFilterComponent,
    ReportTableComponent,
  ],
  templateUrl: './applicant-registered.component.html',
  styleUrls: ['./applicant-registered.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantRegisteredComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<ApplicantRegisteredReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3];

  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableRows = computed<ReportTableRow[]>(
    () => this.report()?.rows.map(toTableRow) ?? [],
  );
  protected readonly tableFileName = computed(() => {
    const report = this.report();
    return report
      ? `applicant-registered-${report.start_date}-to-${report.end_date}`
      : 'applicant-registered';
  });

  /** Summary cards derived from the report; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    const { new_registrants, total_registrants, female_pct, male_pct } = report;
    return [
      {
        icon: 'person_add',
        tone: 'teal',
        label: 'New registrants',
        value: formatNumber(new_registrants.value),
        delta:
          new_registrants.change_pct === null
            ? undefined
            : {
                text: `${new_registrants.change_pct >= 0 ? '+' : ''}${new_registrants.change_pct}% vs previous period`,
                positive: new_registrants.change_pct >= 0,
              },
      },
      {
        icon: 'groups',
        tone: 'green',
        label: 'Total registrants',
        value: formatNumber(total_registrants),
      },
      {
        icon: 'female',
        tone: 'amber',
        label: 'Female',
        value: `${female_pct}%`,
      },
      {
        icon: 'male',
        tone: 'grey',
        label: 'Male',
        value: `${male_pct}%`,
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
      this.report.set(await this.reportsService.applicantRegistered(params));
    } catch {
      this.snackBar.open('Failed to load the Applicant Registered report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
