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
import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJobStatus,
} from '../../../core/models/recommended-job.model';
import { JobMatch } from '../job-match.model';

interface StatusOption {
  readonly value: RecommendedJobStatus;
  readonly label: string;
  readonly icon: string;
  readonly danger?: boolean;
}

/** Emitted when the officer advances a referral's lifecycle status. */
export interface ReferralStatusChange {
  readonly match: JobMatch;
  readonly status: RecommendedJobStatus;
}

type StepState = 'done' | 'current' | 'pending' | 'failed' | 'withdrawn';

interface StepNode {
  readonly label: string;
  readonly state: StepState;
  /** Small caption under the dot (referred date, or "—" when unknown). */
  readonly sub: string;
  /** Color of the connector line to the next step. */
  readonly line?: 'green' | 'red';
}

/** One referral rendered as an accordion row. */
interface ReferralRow {
  readonly id: string;
  readonly match: JobMatch;
  /** The most recent referral is flagged with the "Latest" badge. */
  readonly isLatest: boolean;
  readonly title: string;
  readonly companyName: string;
  /** Officer who referred the applicant ("Referred by"); null when unknown. */
  readonly referredBy: string | null;
  /** Header meta: company · salary · referred date. */
  readonly headerSegments: readonly string[];
  /** Expanded job-card meta: company · location · salary. */
  readonly jobSegments: readonly string[];
  readonly score: number;
  readonly statusLabel: string;
  /** Status pill tone class suffix (referred | interview | hired | ...). */
  readonly statusTone: string;
  readonly referredOnLabel: string;
  readonly steps: readonly StepNode[];
}

/** Pill tone per status, matching the timeline's semantics. */
const STATUS_TONE: Record<RecommendedJobStatus, string> = {
  referred: 'referred',
  interview_scheduled: 'interview',
  hired: 'hired',
  withdrawn: 'withdrawn',
  not_hired: 'not-hired',
};

/** Position of each status on the Referred → Interview → Hired timeline. */
const STATUS_INDEX: Record<RecommendedJobStatus, number> = {
  referred: 0,
  interview_scheduled: 1,
  hired: 2,
  withdrawn: 0,
  not_hired: 0,
};

const STEP_LABELS: readonly string[] = ['Referred', 'Interview', 'Hired'];

/** Build the three-node status timeline for a referral. */
const buildSteps = (status: RecommendedJobStatus, referredShort: string): StepNode[] => {
  // "Not hired" / "Withdrawn" are terminal: the first two steps are completed
  // and the final step is replaced with the terminal node.
  let base: { label: string; state: StepState }[];
  if (status === 'not_hired' || status === 'withdrawn') {
    base = [
      { label: 'Referred', state: 'done' },
      { label: 'Interview', state: 'done' },
      {
        label: RECOMMENDED_JOB_STATUS_LABEL[status],
        state: status === 'not_hired' ? 'failed' : 'withdrawn',
      },
    ];
  } else {
    const activeIndex = STATUS_INDEX[status];
    base = STEP_LABELS.map((label, index) => {
      const state: StepState =
        index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'pending';
      return { label, state };
    });
  }

  return base.map((step, index) => {
    const next = base[index + 1];
    let line: StepNode['line'] | undefined;
    if (next) {
      if (next.state === 'failed') {
        line = 'red';
      } else if (next.state === 'withdrawn') {
        line = undefined;
      } else if (step.state === 'done') {
        line = 'green';
      }
    }
    // Only the referral date is known; later milestones show a placeholder.
    const sub = index === 0 ? referredShort : '—';
    return { ...step, sub, line };
  });
};

/**
 * Referred-jobs card: lists every referral for an applicant as an accordion,
 * each row tracking and advancing its own referral lifecycle status.
 */
@Component({
  selector: 'app-referred-jobs',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, AvatarComponent],
  templateUrl: './referred-jobs.component.html',
  styleUrl: './referred-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferredJobsComponent {
  /** All referrals for the applicant, most-recent first. */
  readonly referrals = input<readonly JobMatch[]>([]);

  readonly statusChange = output<ReferralStatusChange>();
  readonly compare = output<JobMatch>();
  readonly viewJob = output<JobMatch>();
  readonly newReferral = output<void>();

  private readonly datePipe = new DatePipe('en-US');

  protected readonly statusOptions: readonly StatusOption[] = [
    { value: 'referred', label: 'Referred', icon: 'send' },
    { value: 'interview_scheduled', label: 'Interview scheduled', icon: 'calendar_today' },
    { value: 'hired', label: 'Hired', icon: 'check' },
    { value: 'withdrawn', label: 'Withdrawn', icon: 'undo' },
    { value: 'not_hired', label: 'Not hired', icon: 'close', danger: true },
  ];

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
    const referredOn = this.datePipe.transform(match.createdAt, 'MMM d, y') ?? '—';
    const referredShort = this.datePipe.transform(match.createdAt, 'MMM d') ?? '—';
    const salaryText = match.salary === null ? null : `₱${match.salary.toLocaleString('en-US')}/mo`;
    const companyName = match.company?.name ?? '—';

    const headerSegments = [companyName, salaryText, `Referred ${referredOn}`].filter(
      (segment): segment is string => Boolean(segment),
    );
    const jobSegments = [companyName, match.location, salaryText].filter(
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
      jobSegments,
      score: match.score,
      statusLabel: RECOMMENDED_JOB_STATUS_LABEL[status],
      statusTone: STATUS_TONE[status],
      referredOnLabel: referredOn,
      steps: buildSteps(status, referredShort),
    };
  }
}
