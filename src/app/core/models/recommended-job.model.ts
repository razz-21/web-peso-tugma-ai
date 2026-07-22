import { z } from 'zod';
import { JobStatusSchema } from './job.model';

/** Recommendation lifecycle status (Human-in-the-Loop assessment). */
export const RecommendedJobStatusSchema = z.enum([
  'referred',
  'interview_scheduled',
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

/** Lightweight job summary embedded in a recommendation read response. */
export const RecommendedJobJobSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: JobStatusSchema,
  location: z.string().nullable(),
  salary_per_month: z.number().int().nullable(),
  company: RecommendedJobCompanySchema.nullable(),
});

// Unknown keys (e.g. the large `embedded_applicant` / `embedded_job` vectors)
// are stripped by zod — the client never needs them.
export const RecommendedJobSchema = z.object({
  id: z.uuid(),
  applicant_id: z.uuid().nullable(),
  scores: RecommendationScoresSchema,
  score: z.number().int(),
  is_relevant: z.boolean(),
  status: RecommendedJobStatusSchema,
  key_matched: z.array(z.string()),
  job: RecommendedJobJobSchema.nullable(),
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
export type RecommendationScores = z.infer<typeof RecommendationScoresSchema>;
export type RecommendedJobCompany = z.infer<typeof RecommendedJobCompanySchema>;
export type RecommendedJobJob = z.infer<typeof RecommendedJobJobSchema>;
export type RecommendedJob = z.infer<typeof RecommendedJobSchema>;
export type RecommendedJobList = z.infer<typeof RecommendedJobListSchema>;
