import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendationScores,
  RecommendedJob,
} from '../../../core/models/recommended-job.model';
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
    resumeVector: recommendation.embedded_applicant,
    jobVector: recommendation.embedded_job,
  };
};
