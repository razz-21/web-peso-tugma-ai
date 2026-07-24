import { z } from 'zod';
import { CompanyTypeSchema } from './company.model';

/**
 * Response shapes for the dashboard API (`/v1/dashboard/*`). Mirrors the
 * backend's dashboard schemas; every read is validated with these before it
 * reaches the store.
 */

// --- Summary cards ---------------------------------------------------------

/** A headline metric with a period-over-period growth badge. */
export const TrendCardSchema = z.object({
  value: z.number().int(),
  change_pct: z.number().nullable(),
});

/** A headline metric with a "N new" badge. */
export const NewCardSchema = z.object({
  value: z.number().int(),
  new: z.number().int(),
});

/** A headline metric with an "across N listings" context badge. */
export const VacanciesCardSchema = z.object({
  value: z.number().int(),
  listings: z.number().int(),
});

export const DashboardSummarySchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  registered_job_seekers: TrendCardSchema,
  active_job_listings: NewCardSchema,
  open_vacancies: VacanciesCardSchema,
  placements: TrendCardSchema,
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

// --- Placements over time --------------------------------------------------

export const MonthlyPlacementSchema = z.object({
  month: z.number().int(),
  label: z.string(),
  count: z.number().int(),
});

export const PlacementsOverTimeSchema = z.object({
  year: z.number().int(),
  months: z.array(MonthlyPlacementSchema),
});

export type MonthlyPlacement = z.infer<typeof MonthlyPlacementSchema>;
export type PlacementsOverTime = z.infer<typeof PlacementsOverTimeSchema>;

// --- Matching funnel -------------------------------------------------------

export const FunnelStageSchema = z.object({
  key: z.string(),
  label: z.string(),
  count: z.number().int(),
  pct: z.number(),
});

export const MatchingFunnelSchema = z.object({
  matches_generated: z.number().int(),
  stages: z.array(FunnelStageSchema),
  placement_rate: z.number(),
});

export type FunnelStage = z.infer<typeof FunnelStageSchema>;
export type MatchingFunnel = z.infer<typeof MatchingFunnelSchema>;

// --- Activity (recent applicants + top hiring companies) -------------------

export const RecentApplicantStatusSchema = z.enum([
  'hired',
  'interview',
  'referred',
  'withdrawn',
  'not_hired',
  'new',
]);

export const RecentApplicantSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  initials: z.string(),
  role: z.string().nullable(),
  location: z.string().nullable(),
  created_at: z.string(),
  status: RecentApplicantStatusSchema,
  status_label: z.string(),
});

export const TopHiringCompanySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  initials: z.string(),
  company_type: CompanyTypeSchema,
  hires: z.number().int(),
});

export const TopHiringCompaniesSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  items: z.array(TopHiringCompanySchema),
});

export const DashboardActivitySchema = z.object({
  recent_applicants: z.array(RecentApplicantSchema),
  top_hiring_companies: TopHiringCompaniesSchema,
});

export type RecentApplicantStatus = z.infer<typeof RecentApplicantStatusSchema>;
export type RecentApplicant = z.infer<typeof RecentApplicantSchema>;
export type TopHiringCompany = z.infer<typeof TopHiringCompanySchema>;
export type TopHiringCompanies = z.infer<typeof TopHiringCompaniesSchema>;
export type DashboardActivity = z.infer<typeof DashboardActivitySchema>;

// --- Query params ----------------------------------------------------------

/** Shared query params for the dashboard endpoints (all optional). */
export interface DashboardRangeParams {
  /** Inclusive window start, `YYYY-MM-DD`. */
  start_date?: string;
  /** Inclusive window end, `YYYY-MM-DD`. Also sets the year/month for the
   *  placements chart and top-companies month. */
  end_date?: string;
  /** Row cap for the activity lists. */
  limit?: number;
}
