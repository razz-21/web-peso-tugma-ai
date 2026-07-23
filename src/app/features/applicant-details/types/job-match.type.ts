import {
  RecommendationScores,
  RecommendedJobStatus,
} from '../../../core/models/recommended-job.model';

export interface JobMatchTag {
  readonly icon: string;
  readonly label: string;
}

/** One scoring dimension shown in the match-details breakdown. */
export interface JobMatchDimension {
  readonly key: keyof RecommendationScores;
  readonly label: string;
  readonly icon: string;
  /** Factor score, 0–100%. */
  readonly value: number;
  /** Workspace weight, also this dimension's maximum points. */
  readonly weight: number;
  /** Weighted points earned: `round(value × weight ÷ 100)`. */
  readonly points: number;
  /** Score-band color for the value. */
  readonly color: string;
}

/** Hiring company of a recommended job. */
export interface JobMatchCompany {
  readonly id: string;
  readonly name: string;
  readonly avatar: string | null;
}

/** Officer who referred/assessed the recommendation. */
export interface JobMatchAssessor {
  readonly id: string;
  readonly name: string;
  readonly avatar: string | null;
}

/** A single AI-ranked job recommendation shown in the Recommended jobs list. */
export interface JobMatch {
  /** Recommendation record id (used for relevance updates + tracking). */
  readonly recommendationId: string;
  /** The recommended job's id, for navigating to its detail page. */
  readonly jobId: string | null;
  /** Final MatchScore 0–100. */
  readonly score: number;
  /** Ring color, derived from the score band. */
  readonly color: string;
  readonly title: string;
  readonly company: JobMatchCompany | null;
  readonly location: string | null;
  /** Monthly salary in PHP, when the job specifies one. */
  readonly salary: number | null;
  /** Number of open seats on the job posting. */
  readonly vacancies: number | null;
  /** Job requirement fields, for the applicant-vs-job comparison view. */
  readonly skillsRequired: readonly string[];
  readonly experienceRequired: string | null;
  readonly educationRequired: readonly string[];
  /** Hard primary-requirement constraints, for the comparison view's requirements card. */
  readonly ageRange: string | null;
  readonly requiredSex: string | null;
  readonly civilStatusAllowed: readonly string[];
  /** Free-text eligibility requirement (licenses, civil-service, ...), for the comparison view. */
  readonly eligibilityRequired: string | null;
  /** Whether the applicant satisfies the job's eligibility requirement (computed at generation). */
  readonly eligible: boolean;
  /** Preformatted meta line: company · location · salary. */
  readonly metaSegments: readonly string[];
  /** Human-in-the-Loop relevance flag. */
  readonly isRelevant: boolean;
  /** Referral lifecycle status; null until the applicant is referred to this job. */
  readonly status: RecommendedJobStatus | null;
  /** Human-readable status label; null when not yet referred. */
  readonly statusLabel: string | null;
  /** Officer who referred/assessed this recommendation; null when unresolved. */
  readonly referredBy: JobMatchAssessor | null;
  /** When this recommendation was created (ISO string), for the referral timeline. */
  readonly createdAt: string;
  /** When this recommendation was last updated (ISO string); tracks referral time. */
  readonly updatedAt: string;
  /** A relevance update is in flight for this recommendation. */
  readonly updating: boolean;
  readonly tags: readonly JobMatchTag[];
  readonly breakdown: readonly JobMatchDimension[];
  readonly keyMatched: readonly string[];
  /** Dense résumé embedding, for the vector-comparison chart. */
  readonly resumeVector: readonly number[];
  /** Dense job-requirements embedding, for the vector-comparison chart. */
  readonly jobVector: readonly number[];
}
