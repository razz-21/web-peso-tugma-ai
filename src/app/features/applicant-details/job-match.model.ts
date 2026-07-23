import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendationScores,
  RecommendedJob,
  RecommendedJobStatus,
} from '../../core/models/recommended-job.model';

/** Highest MatchScore, i.e. the sum of every dimension's full weight. */
export const MAX_MATCH_SCORE = 100;

const RING_GREEN = '#4d6a24';
const RING_TEAL = '#3f7d88';
const RING_AMBER = '#9a7b1e';

/** Ring / score-band color for a 0–100 score. */
export const scoreColor = (score: number): string =>
  score >= 85 ? RING_GREEN : score >= 70 ? RING_TEAL : RING_AMBER;

/**
 * Scoring dimensions in display order, mapped to labels, icons and their
 * workspace weight. Weights double as each dimension's maximum points and sum
 * to {@link MAX_MATCH_SCORE}.
 */
export const SCORE_DIMENSIONS: readonly {
  key: keyof RecommendationScores;
  label: string;
  icon: string;
  weight: number;
}[] = [
  { key: 'semantic_similarity', label: 'Semantic', icon: 'auto_awesome', weight: 50 },
  { key: 'skills', label: 'Skills', icon: 'edit', weight: 20 },
  { key: 'experience', label: 'Experience', icon: 'work', weight: 15 },
  { key: 'educational_background', label: 'Education', icon: 'school', weight: 10 },
  { key: 'location_preference', label: 'Location', icon: 'location_on', weight: 5 },
];

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

/** Map a recommendation read model into the card/drawer view model. */
export const toJobMatch = (recommendation: RecommendedJob, updating: boolean): JobMatch => {
  const scores = recommendation.scores;
  const breakdown = SCORE_DIMENSIONS.map((dimension) => {
    const value = scores[dimension.key];
    return {
      key: dimension.key,
      label: dimension.label,
      icon: dimension.icon,
      value,
      weight: dimension.weight,
      points: Math.round((value * dimension.weight) / 100),
      color: scoreColor(value),
    };
  });
  const company = recommendation.job?.company ?? null;
  const location = recommendation.job?.location ?? null;
  const salary = recommendation.job?.salary_per_month ?? null;
  const salaryText = salary === null ? null : `₱${salary.toLocaleString('en-US')}/mo`;
  return {
    recommendationId: recommendation.id,
    jobId: recommendation.job?.id ?? null,
    score: recommendation.score,
    color: scoreColor(recommendation.score),
    title: recommendation.job?.title ?? 'Job',
    company,
    location,
    salary,
    vacancies: recommendation.job?.no_of_vacancies ?? null,
    skillsRequired: recommendation.job?.skills_required ?? [],
    experienceRequired: recommendation.job?.experience_required ?? null,
    educationRequired: recommendation.job?.minimum_education_attainment ?? [],
    ageRange: recommendation.job?.age_range ?? null,
    requiredSex: recommendation.job?.sex ?? null,
    civilStatusAllowed: recommendation.job?.civil_status ?? [],
    eligibilityRequired: recommendation.job?.eligibility ?? null,
    eligible: recommendation.eligible,
    metaSegments: [company?.name ?? null, location, salaryText].filter(
      (segment): segment is string => Boolean(segment),
    ),
    isRelevant: recommendation.is_relevant,
    status: recommendation.status,
    statusLabel: recommendation.status ? RECOMMENDED_JOB_STATUS_LABEL[recommendation.status] : null,
    referredBy: recommendation.assessor,
    createdAt: recommendation.created_at,
    updating,
    // Surface the dimensions that scored well as quick chips.
    tags: breakdown
      .filter((dimension) => dimension.value >= 50)
      .map((dimension) => ({
        icon: dimension.icon,
        label: `${dimension.label} ${dimension.value}%`,
      })),
    breakdown,
    keyMatched: recommendation.key_matched,
    resumeVector: recommendation.embedded_applicant,
    jobVector: recommendation.embedded_job,
  };
};
