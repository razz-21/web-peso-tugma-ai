import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { ReferralFunnelReport, ReportRangeParams } from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import {
  DateRangeSelection,
  PeriodFilterComponent,
} from '../../../core/components/period-filter/period-filter.component';
import { toIsoDate } from '../report-utils';

/** Visual tone applied to a stat card's icon tile and its funnel bar. */
type StageTone = 'green' | 'teal' | 'amber' | 'grey';

interface StatCard {
  tone: StageTone;
  label: string;
  value: string;
  /** Secondary line beneath the value (e.g. "62.1% of referred"). */
  subtext?: string;
}

/** One horizontal bar of the "Applicants at each stage" chart. */
interface StageBar {
  label: string;
  count: string;
  tone: StageTone;
  /** Bar length as a percentage of the chart rail (headroom kept for the value). */
  widthPct: number;
}

/** One row of the "Stage-by-stage conversion" table. */
interface StageRow {
  stage: string;
  applicants: string;
  /** Share-of-referred as a whole percent (0-100), for the mini progress bar. */
  sharePct: number;
  shareLabel: string;
  conversion: string;
}

const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Render a `Jul 15, 2026` date from a `YYYY-MM-DD`/ISO string; empty when invalid. */
const formatDay = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

@Component({
  selector: 'app-referral-funnel',
  imports: [MatIconModule, RouterLink, SkeletonComponent, PeriodFilterComponent],
  templateUrl: './referral-funnel.component.html',
  styleUrls: ['./referral-funnel.component.scss', '../report-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferralFunnelComponent {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportsLink = APP_ROUTES.reports;

  protected readonly report = signal<ReferralFunnelReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly cardPlaceholders = [0, 1, 2, 3];
  protected readonly barPlaceholders = [0, 1, 2];

  protected readonly cards = computed<StatCard[] | null>(() => {
    const report = this.report();
    if (!report) return null;
    return [
      { tone: 'green', label: 'Referred', value: formatNumber(report.referred) },
      {
        tone: 'teal',
        label: 'Interviewed',
        value: formatNumber(report.interviewed),
        subtext: `${report.interviewed_pct}% of referred`,
      },
      {
        tone: 'amber',
        label: 'Hired',
        value: formatNumber(report.hired),
        subtext: `${report.hired_pct}% of referred`,
      },
      { tone: 'grey', label: 'Did not convert', value: formatNumber(report.did_not_convert) },
    ];
  });

  /** Horizontal funnel bars; widths scale to the referred pool with headroom for labels. */
  protected readonly stageBars = computed<StageBar[]>(() => {
    const report = this.report();
    if (!report) return [];
    const referred = report.referred;
    const width = (count: number): number => (referred ? (count / referred) * 88 : 0);
    return [
      {
        label: 'Referred',
        count: formatNumber(report.referred),
        tone: 'green',
        widthPct: width(report.referred),
      },
      {
        label: 'Interviewed',
        count: formatNumber(report.interviewed),
        tone: 'teal',
        widthPct: width(report.interviewed),
      },
      {
        label: 'Hired',
        count: formatNumber(report.hired),
        tone: 'amber',
        widthPct: width(report.hired),
      },
    ];
  });

  protected readonly stageRows = computed<StageRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    const interviewedShare = Math.round(report.interviewed_pct);
    const hiredShare = Math.round(report.hired_pct);
    return [
      {
        stage: 'Referred',
        applicants: formatNumber(report.referred),
        sharePct: 100,
        shareLabel: '100%',
        conversion: 'Starting pool',
      },
      {
        stage: 'Interviewed',
        applicants: formatNumber(report.interviewed),
        sharePct: interviewedShare,
        shareLabel: `${interviewedShare}%`,
        conversion: `${interviewedShare}% of referred advanced`,
      },
      {
        stage: 'Hired',
        applicants: formatNumber(report.hired),
        sharePct: hiredShare,
        shareLabel: `${hiredShare}%`,
        conversion: `${Math.round(report.interviewed_to_hired_pct)}% of interviewed hired`,
      },
    ];
  });

  protected readonly periodLabel = computed(() => {
    const report = this.report();
    if (!report) return '';
    return `${formatDay(report.start_date)} – ${formatDay(report.end_date)}`;
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
      this.report.set(await this.reportsService.referralToPlacementFunnel(params));
    } catch {
      this.snackBar.open('Failed to load the Referral-to-Placement Funnel report.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
