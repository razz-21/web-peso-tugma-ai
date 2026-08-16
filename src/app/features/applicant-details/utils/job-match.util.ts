import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendationScores,
  RecommendedJob,
} from '../../../core/models/recommended-job.model';
import { MatchingScore } from '../../../core/models/workspace.model';
import { JobMatch } from '../types/job-match.type';

/** Highest MatchScore, i.e. the sum of every dimension's full weight. */
export const MAX_MATCH_SCORE = 100;

const RING_GREEN = '#4d6a24';
const RING_TEAL = '#3f7d88';
const RING_AMBER = '#9a7b1e';

/** Ring / score-band color for a 0–100 score. */
export const scoreColor = (score: number): string =>
  score >= 85 ? RING_GREEN : score >= 70 ? RING_TEAL : RING_AMBER;

/**
 * Scoring dimensions in display order, mapped to labels, icons and the
 * workspace `matching_score` field that weights them. `weightKey` bridges a
 * recommendation's per-dimension score key to its workspace weight, so the
 * live weights (not a hard-coded profile) drive each dimension's points.
 */
export const SCORE_DIMENSIONS: readonly {
  key: keyof RecommendationScores;
  weightKey: keyof MatchingScore;
  label: string;
  icon: string;
}[] = [
  {
    key: 'semantic_similarity',
    weightKey: 'semantic_similarity',
    label: 'Semantic',
    icon: 'auto_awesome',
  },
  { key: 'skills', weightKey: 'skills_match', label: 'Skills', icon: 'edit' },
  { key: 'experience', weightKey: 'experience_match', label: 'Experience', icon: 'work' },
  {
    key: 'educational_background',
    weightKey: 'educational_match',
    label: 'Education',
    icon: 'school',
  },
  {
    key: 'location_preference',
    weightKey: 'location_preference',
    label: 'Location',
    icon: 'location_on',
  },
];

/**
 * Map a recommendation read model into the card/drawer view model, scoring it
 * against the workspace's current `matching_score` weights. The final score is
 * recomputed here from the stored per-dimension scores (which are
 * weight-independent), so editing the workspace weights re-ranks and re-scores
 * existing recommendations live — without regenerating them.
 */
export const toJobMatch = (
  recommendation: RecommendedJob,
  updating: boolean,
  weights: MatchingScore,
): JobMatch => {
  const scores = recommendation.scores;
  const breakdown = SCORE_DIMENSIONS.map((dimension) => {
    const value = scores[dimension.key];
    const weight = weights[dimension.weightKey];
    return {
      key: dimension.key,
      label: dimension.label,
      icon: dimension.icon,
      value,
      weight,
      points: Math.round((value * weight) / 100),
      color: scoreColor(value),
    };
  });
  // Weighted MatchScore, mirroring the backend's combined score:
  // round(Σ score × weight ÷ 100). Weights sum to 100, so this stays 0–100.
  const score = Math.round(
    breakdown.reduce((total, dimension) => total + dimension.value * dimension.weight, 0) / 100,
  );
  const company = recommendation.job?.company ?? null;
  const location = recommendation.job?.location ?? null;
  const salary = recommendation.job?.salary_per_month ?? null;
  const salaryText = salary === null ? null : `₱${salary.toLocaleString('en-US')}/mo`;
  return {
    recommendationId: recommendation.id,
    jobId: recommendation.job?.id ?? null,
    score,
    color: scoreColor(score),
    title: recommendation.job?.title ?? 'Job',
    company,
    location,
    salary,
    vacancies: recommendation.job?.no_of_vacancies ?? null,
    // A missing job (or a non-active one) can't be referred to.
    active: recommendation.job?.status === 'active',
    skillsRequired: recommendation.job?.skills_required ?? [],
    experienceRequired: recommendation.job?.experience_required ?? null,
    educationRequired: recommendation.job?.minimum_education_attainment ?? [],
    courseRequired: recommendation.job?.course_program ?? null,
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
    updatedAt: recommendation.updated_at,
    referredAt: recommendation.referred_at,
    updating,
    // Surface the dimensions that scored well as quick chips. Semantic
    // similarity is always shown — it's the highest-weighted, headline AI
    // signal, so hiding it just because it dipped below the 50% cutoff (while
    // lesser dimensions show) reads as missing data.
    tags: breakdown
      .filter((dimension) => dimension.key === 'semantic_similarity' || dimension.value >= 50)
      .map((dimension) => ({
        icon: dimension.icon,
        label: `${dimension.label} ${dimension.value}%`,
      })),
    breakdown,
    keyMatched: recommendation.key_matched,
    skillMatches: recommendation.skill_matches,
    resumeVector: recommendation.embedded_applicant,
    jobVector: recommendation.embedded_job,
  };
};
