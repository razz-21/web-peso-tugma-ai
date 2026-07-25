import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import {
  ApplicantReferredReport,
  ApplicantReferredRow,
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
import { formatReferralDate, monthlyRangeLabel, toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** Secondary line beneath the value (e.g. "this period"). */
  subtext?: string;
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');
const EM_DASH = '—';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address', wrap: true },
  { key: 'skills', label: 'Skills', wrap: true },
  { key: 'gender', label: 'Gender' },
  { key: 'civil_status', label: 'Civil Status' },
  { key: 'age', label: 'Age' },
  { key: 'education', label: 'Education', wrap: true },
  { key: 'course_program', label: 'Course/Program', wrap: true },
  { key: 'position', label: 'Position' },
  { key: 'status', label: 'Status' },
  { key: 'date_referred', label: 'Date Referred' },
  { key: 'contact_number', label: 'Contact Number' },
  { key: 'company_referred', label: 'Company Referred' },
  { key: 'city_province_address', label: 'City/Province Address' },
];

const toTableRow = (row: ApplicantReferredRow): ReportTableRow => ({
  name: row.name ?? EM_DASH,
  address: row.address ?? EM_DASH,
  skills: row.skills.length ? row.skills.join(', ') : EM_DASH,
  gender: row.gender ?? EM_DASH,
  civil_status: row.civil_status ?? EM_DASH,
  age: row.age === null ? EM_DASH : String(row.age),
  education: row.education ?? EM_DASH,
  course_program: row.course_program ?? EM_DASH,
  position: row.position ?? EM_DASH,
  status: row.status ?? EM_DASH,
  date_referred: formatReferralDate(row.date_referred),
  contact_number: row.contact_number ?? EM_DASH,
  company_referred: row.company_referred ?? EM_DASH,
  // Intentionally blank — a placeholder column requested for the export layout.
  city_province_address: '',
});

@Component({
  selector: 'app-applicant-referred',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    MonthlyBarChartComponent,
    PeriodFilterComponent,
    ReportTableComponent,
  ],
  templateUrl: './applicant-referred.component.html',
  styleUrls: ['./applicant-referred.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantReferredComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<ApplicantReferredReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3];

  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableRows = computed<ReportTableRow[]>(
    () => this.report()?.rows.map(toTableRow) ?? [],
  );
  protected readonly tableFileName = computed(() => {
    const report = this.report();
    return report
      ? `applicant-referred-${report.start_date}-to-${report.end_date}`
      : 'applicant-referred';
  });

  /** Summary cards derived from the report; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    return [
      {
        icon: 'send',
        tone: 'green',
        label: 'Referrals made',
        value: formatNumber(report.referrals_made),
        subtext: 'this period',
      },
      {
        icon: 'group',
        tone: 'teal',
        label: 'Unique applicants',
        value: formatNumber(report.unique_applicants),
      },
      {
        icon: 'event_available',
        tone: 'amber',
        label: 'To interview',
        value: `${report.to_interview_pct}%`,
      },
      {
        icon: 'history',
        tone: 'grey',
        label: 'Total referrals',
        value: formatNumber(report.total_referrals),
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
      this.report.set(await this.reportsService.applicantReferred(params));
    } catch {
      this.snackBar.open('Failed to load the Applicant Referred report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
