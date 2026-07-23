import { z } from 'zod';
import { JobStatusSchema } from './job.model';

/** Recommendation lifecycle status (Human-in-the-Loop assessment). */
export const RecommendedJobStatusSchema = z.enum([
  'referred',
  'interview_scheduled',
  'hired',
  'withdrawn',
  'not_hired',
]);

/** Per-dimension match scores (0-100) produced by the AI pipeline. */
export const RecommendationScoresSchema = z.object({
  semantic_similarity: z.number().int(),
  skills: z.number().int(),
  experience: z.number().int(),
  educational_background: z.number().int(),
  location_preference: z.number().int(),
});

/** Company summary embedded under a recommendation's job (resolves the FK). */
export const RecommendedJobCompanySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  avatar: z.string().nullable(),
});

/** Assessor summary — the officer who referred/assessed (resolves `assessed_by`). */
export const RecommendedJobUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  avatar: z.string().nullable(),
});

/** Lightweight job summary embedded in a recommendation read response. */
export const RecommendedJobJobSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: JobStatusSchema,
  location: z.string().nullable(),
  salary_per_month: z.number().int().nullable(),
  no_of_vacancies: z.number().int().default(0),
  skills_required: z.array(z.string()).default([]),
  experience_required: z.string().nullable().default(null),
  minimum_education_attainment: z.array(z.string()).default([]),
  age_range: z.string().nullable().default(null),
  sex: z.string().nullable().default(null),
  civil_status: z.array(z.string()).default([]),
  eligibility: z.string().nullable().default(null),
  company: RecommendedJobCompanySchema.nullable(),
});

// The dense `embedded_applicant` / `embedded_job` vectors power the résumé vs
// job "vector comparison" chart; every other unknown key is stripped by zod.
export const RecommendedJobSchema = z.object({
  id: z.uuid(),
  applicant_id: z.uuid().nullable(),
  scores: RecommendationScoresSchema,
  score: z.number().int(),
  eligible: z.boolean().default(true),
  is_relevant: z.boolean(),
  // Nullable: a fresh recommendation is unassessed until an officer refers the
  // applicant (which sets 'referred') and advances the referral lifecycle.
  status: RecommendedJobStatusSchema.nullable(),
  embedded_applicant: z.array(z.number()).default([]),
  embedded_job: z.array(z.number()).default([]),
  key_matched: z.array(z.string()),
  job: RecommendedJobJobSchema.nullable(),
  // Resolved assessor ({ id, name, avatar }); null when the user is missing.
  assessor: RecommendedJobUserSchema.nullable().default(null),
  date_registered: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** `POST /recommended-jobs/generate` returns the ranked Top-K directly. */
export const RecommendedJobArraySchema = z.array(RecommendedJobSchema);

export const RecommendedJobListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(RecommendedJobSchema),
});

export type RecommendedJobStatus = z.infer<typeof RecommendedJobStatusSchema>;

/** Human-readable label for each referral lifecycle status. */
export const RECOMMENDED_JOB_STATUS_LABEL: Record<RecommendedJobStatus, string> = {
  referred: 'Referred',
  interview_scheduled: 'Interview scheduled',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
  not_hired: 'Not hired',
};

export type RecommendationScores = z.infer<typeof RecommendationScoresSchema>;
export type RecommendedJobCompany = z.infer<typeof RecommendedJobCompanySchema>;
export type RecommendedJobUser = z.infer<typeof RecommendedJobUserSchema>;
export type RecommendedJobJob = z.infer<typeof RecommendedJobJobSchema>;
export type RecommendedJob = z.infer<typeof RecommendedJobSchema>;
export type RecommendedJobList = z.infer<typeof RecommendedJobListSchema>;
