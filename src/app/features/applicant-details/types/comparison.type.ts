import { ApplicantGet } from '../../../core/models/applicant.model';
import { JobMatch } from './job-match.type';

/** Data handed to the full-page comparison dialog. */
export interface ComparisonDialogData {
  readonly applicant: ApplicantGet;
  readonly match: JobMatch;
}

export type RequirementStatus = 'met' | 'partial' | 'unmet' | 'unknown';

/** Requirement tier of a skill: a must-have vs. a nice-to-have. */
export type SkillTier = 'mandatory' | 'preferred';

/** A job skill with its requirement tier, for matched / missing chips. */
export interface SkillTierItem {
  /** The job's skill (e.g. "Excel"). */
  readonly name: string;
  /** 'mandatory' (required) or 'preferred' (nice-to-have). */
  readonly tier: SkillTier;
}

/** A required skill covered by a related (not exact) applicant skill. */
export interface SkillChip {
  /** The job's required skill (e.g. "Excel"). */
  readonly required: string;
  /** The applicant skill that covers it (e.g. "Google Sheets"). */
  readonly via: string | null;
  /** Best similarity as a 0–100 percentage. */
  readonly similarity: number;
  /** 'mandatory' (required) or 'preferred' (nice-to-have). */
  readonly tier: SkillTier;
}

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
  readonly matchedSkills: readonly SkillTierItem[];
  /** Required skills covered by a related (not exact) applicant skill. */
  readonly relatedSkills: readonly SkillChip[];
  readonly missingSkills: readonly SkillTierItem[];
  /** Applicant skills covering a requirement (exact or related), for the
   * "Matching" column. */
  readonly matchingSkills: readonly string[];
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
