import { ApplicantGet } from '../../../core/models/applicant.model';
import { JobMatch } from './job-match.type';

/** Data handed to the full-page comparison dialog. */
export interface ComparisonDialogData {
  readonly applicant: ApplicantGet;
  readonly match: JobMatch;
}

export type RequirementStatus = 'met' | 'partial' | 'unmet' | 'unknown';

/** One requirement row (skills / experience / education / location). */
export interface RequirementView {
  readonly key: string;
  readonly label: string;
  /** Lower-cased label, for the summary sentence. */
  readonly lower: string;
  readonly icon: string;
  readonly status: RequirementStatus;
  /** Header badge, e.g. "3 of 5 matched" or "Met". */
  readonly badge: string;
  readonly coverage: number;
  readonly coverageColor: string;
  readonly isSkills: boolean;
  // Skills detail.
  readonly matchedSkills: readonly string[];
  readonly missingSkills: readonly string[];
  readonly additionalSkills: readonly string[];
  readonly note: string | null;
  // Generic detail (experience / education / location).
  readonly requiredItems: readonly string[];
  readonly requiredText: string | null;
  readonly applicantItems: readonly string[];
  readonly applicantText: string | null;
}

export interface ComparisonSummary {
  readonly title: string;
  readonly subtitle: string;
  readonly metCount: number;
  readonly partialCount: number;
  readonly unmetCount: number;
  readonly unknownCount: number;
}

/** Outcome of a single hard primary-requirement gate. */
export type RequirementState = 'pass' | 'fail' | 'na' | 'unknown';

/** One primary-requirement gate row (vacancies / age / sex / civil status). */
export interface RequirementRow {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly state: RequirementState;
  readonly reason: string;
}

export interface RequirementSummary {
  readonly rows: readonly RequirementRow[];
  readonly met: boolean;
}

/** Applicant-vs-job eligibility comparison (licenses / civil-service, ...). */
export interface EligibilityView {
  /** Whether the job states an eligibility requirement at all. */
  readonly hasRequirement: boolean;
  /** The job's free-text requirement, when stated. */
  readonly required: string | null;
  /** Titles of the eligibilities the applicant holds. */
  readonly applicantHeld: readonly string[];
  /** pass = eligible, fail = not eligible, na = no requirement. */
  readonly state: RequirementState;
  /** Header pill text. */
  readonly badge: string;
  /** One-line explanation shown under the columns. */
  readonly reason: string;
}
