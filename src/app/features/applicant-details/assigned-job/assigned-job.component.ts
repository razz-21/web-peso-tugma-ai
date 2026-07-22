import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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

type StepState = 'done' | 'current' | 'pending' | 'failed' | 'withdrawn';

interface StepNode {
  readonly label: string;
  readonly state: StepState;
  /** Color of the connector line to the next step. */
  readonly line?: 'green' | 'red';
}

interface PreviousRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly danger: boolean;
}

/** Position of each status on the Referred → Interview → Hired timeline. */
const STATUS_INDEX: Record<RecommendedJobStatus, number> = {
  referred: 0,
  interview_scheduled: 1,
  hired: 2,
  withdrawn: 0,
  not_hired: 0,
};

const STEP_LABELS: readonly string[] = ['Referred', 'Interview', 'Hired'];

/** Referred-job card: tracks and advances a recommendation's referral status. */
@Component({
  selector: 'app-assigned-job',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './assigned-job.component.html',
  styleUrl: './assigned-job.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignedJobComponent {
  /** The active referral this card tracks (status is guaranteed non-null). */
  readonly referral = input.required<JobMatch>();
  /** Earlier referrals for the same applicant, shown as history. */
  readonly previous = input<readonly JobMatch[]>([]);
  /** Emitted when the officer picks a new status from the menu. */
  readonly statusChange = output<RecommendedJobStatus>();

  protected readonly statusOptions: readonly StatusOption[] = [
    { value: 'referred', label: 'Referred', icon: 'send' },
    { value: 'interview_scheduled', label: 'Interview scheduled', icon: 'calendar_today' },
    { value: 'hired', label: 'Hired', icon: 'check' },
    { value: 'withdrawn', label: 'Withdrawn', icon: 'undo' },
    { value: 'not_hired', label: 'Not hired', icon: 'close', danger: true },
  ];

  /** Current status, defaulting to 'referred' (the referral is always set). */
  protected readonly status = computed<RecommendedJobStatus>(
    () => this.referral().status ?? 'referred',
  );

  protected readonly statusLabel = computed(() => RECOMMENDED_JOB_STATUS_LABEL[this.status()]);

  protected readonly previousRows = computed<readonly PreviousRow[]>(() =>
    this.previous().map((match) => ({
      id: match.recommendationId,
      title: match.title,
      subtitle: match.company?.name ?? match.location ?? '',
      status: RECOMMENDED_JOB_STATUS_LABEL[match.status ?? 'referred'],
      danger: match.status === 'not_hired' || match.status === 'withdrawn',
    })),
  );

  protected readonly steps = computed<StepNode[]>(() => {
    const status = this.status();

    // "Not hired" / "Withdrawn" are terminal outcomes: the first two steps are
    // completed and the final step is replaced with the terminal node.
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
      return { ...step, line };
    });
  });

  protected setStatus(status: RecommendedJobStatus): void {
    if (status !== this.status()) {
      this.statusChange.emit(status);
    }
  }
}
