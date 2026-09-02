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
  job_location: z.string().nullable(),
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

/** The position accounting for the most placements in the window. */
export const TopPlacedPositionSchema = z.object({
  position: z.string().nullable(),
  placements: z.number().int(),
});

/** One row of the Applicant Placed report table — a single placement (hire). */
export const ApplicantPlacedRowSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  skills: z.array(z.string()),
  gender: z.string().nullable(),
  civil_status: z.string().nullable(),
  age: z.number().int().nullable(),
  education: z.string().nullable(),
  course_program: z.string().nullable(),
  position: z.string().nullable(),
  date_placed: z.string(),
  contact_number: z.string().nullable(),
  company_placed: z.string().nullable(),
  city_province_address: z.string().nullable(),
});

export const ApplicantPlacedReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  placements_made: z.number().int(),
  unique_applicants: z.number().int(),
  top_position: TopPlacedPositionSchema,
  total_placements: z.number().int(),
  monthly: z.array(MonthlyCountSchema),
  rows: z.array(ApplicantPlacedRowSchema),
});

export type TopPlacedPosition = z.infer<typeof TopPlacedPositionSchema>;
export type ApplicantPlacedRow = z.infer<typeof ApplicantPlacedRowSchema>;
export type ApplicantPlacedReport = z.infer<typeof ApplicantPlacedReportSchema>;

/** Headline "New registrants" metric with a period-over-period badge. */
export const NewRegistrantsCardSchema = z.object({
  value: z.number().int(),
  change_pct: z.number().nullable(),
});

/** One row of the Applicant Registered report table — a new job seeker. */
export const ApplicantRegisteredRowSchema = z.object({
  name: z.string().nullable(),
  age: z.number().int().nullable(),
  sex: z.string().nullable(),
  education: z.string().nullable(),
  course_program: z.string().nullable(),
  school_university: z.string().nullable(),
  desired_roles: z.array(z.string()),
  registered: z.string(),
  status: z.string(),
});

export const ApplicantRegisteredReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  new_registrants: NewRegistrantsCardSchema,
  total_registrants: z.number().int(),
  female_pct: z.number(),
  male_pct: z.number(),
  monthly: z.array(MonthlyCountSchema),
  rows: z.array(ApplicantRegisteredRowSchema),
});

export type NewRegistrantsCard = z.infer<typeof NewRegistrantsCardSchema>;
export type ApplicantRegisteredRow = z.infer<typeof ApplicantRegisteredRowSchema>;
export type ApplicantRegisteredReport = z.infer<typeof ApplicantRegisteredReportSchema>;

/** A category label with its count (one bar of a breakdown). */
export const LabeledCountSchema = z.object({
  label: z.string(),
  count: z.number().int(),
});

/** Headline "New this period" metric with an absolute change badge. */
export const NewEstablishmentsCardSchema = z.object({
  value: z.number().int(),
  change: z.number().int().nullable(),
});

/** One row of the Establishment directory table. */
export const EstablishmentRowSchema = z.object({
  company: z.string(),
  type: z.string(),
  address: z.string().nullable(),
  contact_number: z.string().nullable(),
  email: z.string().nullable(),
  jobs_posted: z.number().int(),
  registered: z.string(),
});

export const EstablishmentsRegisteredReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  total_establishments: z.number().int(),
  new_this_period: NewEstablishmentsCardSchema,
  corporations: z.number().int(),
  with_active_jobs: z.number().int(),
  by_type: z.array(LabeledCountSchema),
  rows: z.array(EstablishmentRowSchema),
});

export type LabeledCount = z.infer<typeof LabeledCountSchema>;
export type NewEstablishmentsCard = z.infer<typeof NewEstablishmentsCardSchema>;
export type EstablishmentRow = z.infer<typeof EstablishmentRowSchema>;
export type EstablishmentsRegisteredReport = z.infer<typeof EstablishmentsRegisteredReportSchema>;

/** The roll-up of all facilitation services for the selected window. */
export const PesoAccomplishmentReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  job_seekers_registered: z.number().int(),
  establishments_engaged: z.number().int(),
  vacancies_solicited: z.number().int(),
  applicants_referred: z.number().int(),
  applicants_placed: z.number().int(),
  /** `applicants_placed / applicants_referred` as a percentage. */
  placement_rate: z.number(),
});

export type PesoAccomplishmentReport = z.infer<typeof PesoAccomplishmentReportSchema>;

/** Conversion at each stage from referral through to hire, for the window. */
export const ReferralFunnelReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  referred: z.number().int(),
  interviewed: z.number().int(),
  hired: z.number().int(),
  did_not_convert: z.number().int(),
  /** Share of the referred cohort that reached the interview stage or beyond. */
  interviewed_pct: z.number(),
  /** Share of the referred cohort that was hired. */
  hired_pct: z.number(),
  /** Share of the interviewed who were hired. */
  interviewed_to_hired_pct: z.number(),
});

export type ReferralFunnelReport = z.infer<typeof ReferralFunnelReportSchema>;

/** A headline metric with a period-over-period badge (percentage change). */
export const SummaryMetricSchema = z.object({
  value: z.number().int(),
  /** Percentage change vs the preceding equal-length window; `null` when there
   *  is no baseline to compare against (the badge is then hidden). */
  change_pct: z.number().nullable(),
});

export type SummaryMetric = z.infer<typeof SummaryMetricSchema>;

/** One row of the "Top 10 job vacancies" table — an open listing and the
 *  establishment that posted it. */
export const TopVacancyRowSchema = z.object({
  job_title: z.string(),
  company: z.string().nullable(),
  /** Company logo (data URL / image URL); `null` falls back to initials. */
  company_avatar: z.string().nullable(),
  vacancies: z.number().int(),
  location: z.string().nullable(),
});

export type TopVacancyRow = z.infer<typeof TopVacancyRowSchema>;

/** A one-glance snapshot of employment facilitation for the selected window:
 *  headline cards plus the employment-status, placement-rate, and
 *  unemployed-by-gender breakdowns, with a current top-vacancies snapshot. */
export const EmploymentSummaryReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  vacancies_solicited: SummaryMetricSchema,
  registered_applicants: SummaryMetricSchema,
  placed_applicants: SummaryMetricSchema,
  /** Registered-in-window cohort size; `employed + unemployed`. */
  registered_total: z.number().int(),
  employed: z.number().int(),
  unemployed: z.number().int(),
  referred: z.number().int(),
  placed: z.number().int(),
  /** `placed / referred` as a percentage. */
  placement_rate: z.number(),
  unemployed_male: z.number().int(),
  unemployed_female: z.number().int(),
  top_vacancies: z.array(TopVacancyRowSchema),
});

export type EmploymentSummaryReport = z.infer<typeof EmploymentSummaryReportSchema>;

/** The "Unemployed Applicants by Education" report: the unemployed cohort for
 *  the selected window, profiled by course / program. `top_courses` ranks the
 *  courses by headcount (top 10); `with_course` is the count who hold or are
 *  pursuing a course and is the denominator behind `top3_share_pct`. */
export const UnemployedByEducationReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  total_unemployed: z.number().int(),
  most_common_course: z.string().nullable(),
  college_graduates: z.number().int(),
  with_course: z.number().int(),
  top3_share_pct: z.number(),
  top_courses: z.array(LabeledCountSchema),
  by_education_level: z.array(LabeledCountSchema),
});

export type UnemployedByEducationReport = z.infer<typeof UnemployedByEducationReportSchema>;

/** Shared query params for the report endpoints (all optional). */
export interface ReportRangeParams {
  /** Inclusive window start, `YYYY-MM-DD`. */
  start_date?: string;
  /** Inclusive window end, `YYYY-MM-DD`. */
  end_date?: string;
}
