import { z } from 'zod';

/**
 * Response shapes for the reports API (`/v1/reports/*`). Mirrors the backend's
 * report schemas; every read is validated with these before it reaches a
 * component.
 */

/** One bar of a per-month report chart. */
export const MonthlyCountSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  label: z.string(),
  count: z.number().int(),
});

export type MonthlyCount = z.infer<typeof MonthlyCountSchema>;

// --- Job Solicited ---------------------------------------------------------

/** Headline "Vacancies solicited" metric with a period-over-period badge. */
export const VacanciesSolicitedCardSchema = z.object({
  value: z.number().int(),
  /** Absolute change vs the preceding equal-length window; `null` when there is
   *  no baseline to compare against. */
  change: z.number().int().nullable(),
});

/** The occupation accounting for the most solicited vacancies in the window. */
export const TopOccupationSchema = z.object({
  occupation: z.string().nullable(),
  vacancies: z.number().int(),
});

/** One row of the Job Solicited report table — a single solicited vacancy. */
export const JobSolicitedRowSchema = z.object({
  job_title: z.string(),
  no_of_vacancies: z.number().int(),
  age_range: z.string().nullable(),
  sex: z.string().nullable(),
  civil_status: z.array(z.string()),
  educational_attainment: z.array(z.string()),
  course_program: z.string().nullable(),
  company: z.string().nullable(),
  salary_per_month: z.number().int().nullable(),
});

export const JobSolicitedReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  vacancies_solicited: VacanciesSolicitedCardSchema,
  establishments_engaged: z.number().int(),
  avg_per_establishment: z.number(),
  top_occupation: TopOccupationSchema,
  monthly: z.array(MonthlyCountSchema),
  rows: z.array(JobSolicitedRowSchema),
});

export type VacanciesSolicitedCard = z.infer<typeof VacanciesSolicitedCardSchema>;
export type TopOccupation = z.infer<typeof TopOccupationSchema>;
export type JobSolicitedRow = z.infer<typeof JobSolicitedRowSchema>;
export type JobSolicitedReport = z.infer<typeof JobSolicitedReportSchema>;

// --- Applicant Referred ----------------------------------------------------

/** One row of the Applicant Referred report table — a single referral. */
export const ApplicantReferredRowSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  skills: z.array(z.string()),
  gender: z.string().nullable(),
  civil_status: z.string().nullable(),
  age: z.number().int().nullable(),
  education: z.string().nullable(),
  course_program: z.string().nullable(),
  position: z.string().nullable(),
  status: z.string().nullable(),
  date_referred: z.string(),
  contact_number: z.string().nullable(),
  company_referred: z.string().nullable(),
  city_province_address: z.string().nullable(),
});

export const ApplicantReferredReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  referrals_made: z.number().int(),
  unique_applicants: z.number().int(),
  to_interview_pct: z.number(),
  total_referrals: z.number().int(),
  monthly: z.array(MonthlyCountSchema),
  rows: z.array(ApplicantReferredRowSchema),
});

export type ApplicantReferredRow = z.infer<typeof ApplicantReferredRowSchema>;
export type ApplicantReferredReport = z.infer<typeof ApplicantReferredReportSchema>;

// --- Query params ----------------------------------------------------------

/** Shared query params for the report endpoints (all optional). */
export interface ReportRangeParams {
  /** Inclusive window start, `YYYY-MM-DD`. */
  start_date?: string;
  /** Inclusive window end, `YYYY-MM-DD`. */
  end_date?: string;
}
