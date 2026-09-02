import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJobStatus,
} from '../../../core/models/recommended-job.model';
import { JobMatch } from '../types/job-match.type';
import { ReferralRow, ReferralStatusChange, StatusOption } from '../types/referred-jobs.type';
import { STATUS_TONE, buildSteps, isTerminalStatus } from '../utils/referred-jobs.util';

/**
 * Referred-jobs card: lists every referral for an applicant as an accordion,
 * each row tracking and advancing its own referral lifecycle status.
 */
@Component({
  selector: 'app-referred-jobs',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, AvatarComponent, SkeletonComponent],
  templateUrl: './referred-jobs.component.html',
  styleUrl: './referred-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferredJobsComponent {
  /** All referrals for the applicant, most-recent first. */
  readonly referrals = input<readonly JobMatch[]>([]);
  /** Shows placeholder rows during the initial referrals fetch. */
  readonly loading = input<boolean>(false);
  /** When true, disables adding or modifying referrals (e.g. inactive applicant). */
  readonly disabled = input<boolean>(false);
  /**
   * Whether the current user may delete a referral. Only admins / super admins
   * qualify — officers never see the delete action.
   */
  readonly canDelete = input<boolean>(false);

  /** Placeholder rows rendered while referrals load. */
  protected readonly skeletonRows = [0, 1] as const;

  readonly statusChange = output<ReferralStatusChange>();
  readonly compare = output<JobMatch>();
  readonly viewJob = output<JobMatch>();
  readonly newReferral = output<void>();
  readonly deleteReferral = output<JobMatch>();

  private readonly datePipe = new DatePipe('en-US');

  protected readonly statusOptions: readonly StatusOption[] = [
    { value: 'referred', label: 'Referred', icon: 'send' },
    { value: 'interview_scheduled', label: 'Interview scheduled', icon: 'calendar_today' },
    { value: 'hired', label: 'Hired', icon: 'check' },
    { value: 'withdrawn', label: 'Withdrawn', icon: 'undo' },
    { value: 'not_hired', label: 'Not hired', icon: 'close', danger: true },
    // Reachable only from 'hired' — filtered in by `optionsFor`.
    { value: 'resigned', label: 'Resigned', icon: 'logout' },
  ];

  /**
   * Status options offered for a referral's current status. 'Resigned' only
   * makes sense once 'hired', so it is hidden otherwise.
   */
  protected optionsFor(status: RecommendedJobStatus | null): readonly StatusOption[] {
    return this.statusOptions.filter((option) => option.value !== 'resigned' || status === 'hired');
  }

  protected readonly rows = computed<readonly ReferralRow[]>(() =>
    this.referrals().map((match, index) => this.toRow(match, index === 0)),
  );

  /**
   * The expanded row's id. Defaults to the latest referral and resets to it when
   * the referral list changes; the officer can still toggle any row.
   */
  protected readonly openId = linkedSignal<readonly ReferralRow[], string | null>({
    source: this.rows,
    computation: (rows) => rows[0]?.id ?? null,
  });

  protected toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  protected onStatus(match: JobMatch, status: RecommendedJobStatus): void {
    if (status !== match.status) {
      this.statusChange.emit({ match, status });
    }
  }

  private toRow(match: JobMatch, isLatest: boolean): ReferralRow {
    const status = match.status ?? 'referred';
    const referredOn = this.datePipe.transform(match.referredAt, 'MMM d, y') ?? '—';
    const referredShort = this.datePipe.transform(match.referredAt, 'MMM d') ?? '—';
    const salaryText = match.salary === null ? null : `₱${match.salary.toLocaleString('en-US')}/mo`;
    const companyName = match.company?.name ?? '—';

    const headerSegments = [companyName, salaryText, `Referred ${referredOn}`].filter(
      (segment): segment is string => Boolean(segment),
    );

    return {
      id: match.recommendationId,
      match,
      isLatest,
      title: match.title,
      companyName,
      referredBy: match.referredBy?.name ?? null,
      headerSegments,
      score: match.score,
      statusLabel: RECOMMENDED_JOB_STATUS_LABEL[status],
      statusTone: STATUS_TONE[status],
      referredOnLabel: referredOn,
      steps: buildSteps(status, referredShort),
      // Terminal referrals (withdrawn / not hired / resigned) are final — the
      // template disables "Update status" for them.
      terminal: isTerminalStatus(match.status),
    };
  }
}
