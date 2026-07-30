import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJobStatus,
} from '../../../core/models/recommended-job.model';
import { StepNode, StepState } from '../types/referred-jobs.type';

/**
 * Terminal referral statuses: once set, the lifecycle is final and the status
 * can no longer be updated. 'resigned' is reachable only from 'hired'.
 */
export const TERMINAL_STATUSES: ReadonlySet<RecommendedJobStatus> = new Set([
  'withdrawn',
  'not_hired',
  'resigned',
]);

/** Whether a referral's status is terminal (null / unset never is). */
export const isTerminalStatus = (status: RecommendedJobStatus | null): boolean =>
  status !== null && TERMINAL_STATUSES.has(status);

/** Pill tone per status, matching the timeline's semantics. */
export const STATUS_TONE: Record<RecommendedJobStatus, string> = {
  referred: 'referred',
  interview_scheduled: 'interview',
  hired: 'hired',
  withdrawn: 'withdrawn',
  not_hired: 'not-hired',
  resigned: 'resigned',
};

/** Position of each status on the Referred → Interview → Hired timeline. */
const STATUS_INDEX: Record<RecommendedJobStatus, number> = {
  referred: 0,
  interview_scheduled: 1,
  hired: 2,
  withdrawn: 0,
  not_hired: 0,
  resigned: 0,
};

const STEP_LABELS: readonly string[] = ['Referred', 'Interview', 'Hired'];

/** Build the three-node status timeline for a referral. */
export const buildSteps = (status: RecommendedJobStatus, referredShort: string): StepNode[] => {
  // "Not hired" / "Withdrawn" / "Resigned" are terminal: the first two steps are
  // completed and the final step is replaced with the terminal node.
  let base: { label: string; state: StepState }[];
  if (status === 'not_hired' || status === 'withdrawn' || status === 'resigned') {
    base = [
      { label: 'Referred', state: 'done' },
      { label: 'Interview', state: 'done' },
      {
        label: RECOMMENDED_JOB_STATUS_LABEL[status],
        // 'failed' (red) only for not-hired; withdrawn/resigned read as a
        // neutral terminal node.
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
