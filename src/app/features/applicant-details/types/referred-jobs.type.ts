import { RecommendedJobStatus } from '../../../core/models/recommended-job.model';
import { JobMatch } from './job-match.type';

export interface StatusOption {
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

export type StepState = 'done' | 'current' | 'pending' | 'failed' | 'withdrawn';

export interface StepNode {
  readonly label: string;
  readonly state: StepState;
  /** Small caption under the dot (referred date, or "—" when unknown). */
  readonly sub: string;
  /** Color of the connector line to the next step. */
  readonly line?: 'green' | 'red';
}

/** One referral rendered as an accordion row. */
export interface ReferralRow {
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
