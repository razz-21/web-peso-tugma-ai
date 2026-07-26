import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import {
  EstablishmentRow,
  EstablishmentsRegisteredReport,
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
import { formatReferralDate, toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile. */
type StatTone = 'green' | 'teal' | 'grey' | 'amber';

interface StatCard {
  icon: string;
  tone: StatTone;
  label: string;
  value: string;
  /** A change badge (e.g. "+9"). */
  delta?: { text: string; positive: boolean };
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');

const EM_DASH = '—';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'company', label: 'Company' },
  { key: 'type', label: 'Type' },
  { key: 'address', label: 'Address', wrap: true },
  { key: 'contact_number', label: 'Phone Number' },
  { key: 'email', label: 'Email' },
  { key: 'jobs_posted', label: 'Jobs Posted' },
  { key: 'registered', label: 'Registered' },
];

const toTableRow = (row: EstablishmentRow): ReportTableRow => ({
  company: row.company,
  type: row.type,
  address: row.address ?? EM_DASH,
  contact_number: row.contact_number ?? EM_DASH,
  email: row.email ?? EM_DASH,
  jobs_posted: formatNumber(row.jobs_posted),
  registered: formatReferralDate(row.registered),
});

@Component({
  selector: 'app-establishments-registered',
  imports: [
    MatIconModule,
    RouterLink,
    SkeletonComponent,
    MonthlyAreaChartComponent,
    PeriodFilterComponent,
    ReportTableComponent,
  ],
  templateUrl: './establishments-registered.component.html',
  styleUrls: ['./establishments-registered.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstablishmentsRegisteredComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<EstablishmentsRegisteredReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3];

  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableRows = computed<ReportTableRow[]>(
    () => this.report()?.rows.map(toTableRow) ?? [],
  );
  protected readonly tableFileName = computed(() => {
    const report = this.report();
    return report
      ? `establishments-registered-${report.start_date}-to-${report.end_date}`
      : 'establishments-registered';
  });

  /** Summary cards derived from the report; `null` until the first load resolves. */
  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    const { total_establishments, new_this_period, corporations, with_active_jobs } = report;
    return [
      {
        icon: 'apartment',
        tone: 'amber',
        label: 'Total establishments',
        value: formatNumber(total_establishments),
      },
      {
        icon: 'domain_add',
        tone: 'green',
        label: 'New this period',
        value: formatNumber(new_this_period.value),
        delta:
          new_this_period.change === null
            ? undefined
            : {
                text: `${new_this_period.change >= 0 ? '+' : ''}${new_this_period.change}`,
                positive: new_this_period.change >= 0,
              },
      },
      {
        icon: 'corporate_fare',
        tone: 'teal',
        label: 'Corporations',
        value: formatNumber(corporations),
      },
      {
        icon: 'work',
        tone: 'grey',
        label: 'With active jobs',
        value: formatNumber(with_active_jobs),
      },
    ];
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
      this.report.set(await this.reportsService.establishmentsRegistered(params));
    } catch {
      this.snackBar.open('Failed to load the Establishments Registered report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
