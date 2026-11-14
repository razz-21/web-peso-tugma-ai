import { z } from 'zod';
import { RecommendedJobStatusSchema } from './recommended-job.model';

/** Applicant summary shown in a company's applicants table (resolves the FK). */
export const CompanyApplicantApplicantSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  // Applicants carry no avatar today; the table falls back to initials.
  avatar: z.string().nullable().default(null),
});

/**
 * One applicant referred to a company — a referral (a recommended-job row with a
 * lifecycle status set) pointing an applicant at one of the company's jobs.
 * Surfaces exactly what the company details "Applicants" table renders.
 */
export const CompanyApplicantSchema = z.object({
  // The referral (recommended-job) id — the row's stable key.
  id: z.uuid(),
  applicant: CompanyApplicantApplicantSchema.nullable(),
  // Title of the job the applicant was referred to (null if the job is gone).
  referred_to: z.string().nullable(),
  job_id: z.uuid(),
  status: RecommendedJobStatusSchema,
  // When the applicant was referred (recommended-job `referred_at`).
  date_referred: z.string(),
});

export const CompanyApplicantListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(CompanyApplicantSchema),
});

export interface ListCompanyApplicantsParams {
  limit?: number;
  offset?: number;
}

export type CompanyApplicantApplicant = z.infer<typeof CompanyApplicantApplicantSchema>;
export type CompanyApplicant = z.infer<typeof CompanyApplicantSchema>;
export type CompanyApplicantList = z.infer<typeof CompanyApplicantListSchema>;
