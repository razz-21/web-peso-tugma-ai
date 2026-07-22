import { z } from 'zod';
import { CompanyTypeSchema } from './company.model';

/** VARCHAR/SMALLINT limits carried over from the backend jobs schema. */
export const JOB_TITLE_MAX = 50;
export const JOB_VACANCIES_MAX = 32767;

export const JobStatusSchema = z.enum(['active', 'closed']);

export const JOB_STATUSES = JobStatusSchema.options;

export const SexSchema = z.enum(['Female', 'Male', 'Female/Male']);

export const SEXES = SexSchema.options;

/** Company summary embedded in job read responses (resolves the FK). */
export const JobCompanySchema = z.object({
  id: z.uuid(),
  company_name: z.string(),
  company_type: CompanyTypeSchema,
});

/** Fields shared between read and write shapes. */
const JobFieldsSchema = z.object({
  title: z.string().min(1).max(JOB_TITLE_MAX),
  description: z.string().nullable(),
  minimum_education_attainment: z.array(z.string()),
  experience_required: z.string().nullable(),
  skills_required: z.array(z.string()),
  no_of_vacancies: z.number().int().min(1).max(JOB_VACANCIES_MAX),
  salary_per_month: z.number().int().nonnegative().nullable(),
  location: z.string().nullable(),
  age_range: z.string().nullable(),
  sex: SexSchema.nullable(),
  civil_status: z.array(z.string()),
  eligibility: z.string().nullable(),
  status: JobStatusSchema,
});

// Read responses embed the resolved `company` instead of the raw `company_id`.
export const JobSchema = JobFieldsSchema.extend({
  id: z.uuid(),
  company: JobCompanySchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const JobGetSchema = JobSchema;

// Write payloads still send the `company_id` foreign key.
export const JobPostSchema = JobFieldsSchema.extend({
  company_id: z.uuid(),
});

export const JobPatchSchema = JobPostSchema.partial();

export const JobListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(JobGetSchema),
});

export interface ListJobsParams {
  limit?: number;
  offset?: number;
  q?: string;
  company_id?: string;
  status?: JobStatus;
}

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type Sex = z.infer<typeof SexSchema>;
export type JobCompany = z.infer<typeof JobCompanySchema>;
export type Job = z.infer<typeof JobSchema>;
export type JobGet = z.infer<typeof JobGetSchema>;
export type JobPost = z.infer<typeof JobPostSchema>;
export type JobPatch = z.infer<typeof JobPatchSchema>;
export type JobList = z.infer<typeof JobListSchema>;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: 'Active',
  closed: 'Closed',
};

export const SEX_LABELS: Record<Sex, string> = {
  Female: 'Female',
  Male: 'Male',
  'Female/Male': 'Female/Male',
};

/** Preset options for the multi-select `civil_status` field. */
export const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Divorced',
] as const;

/** Preset options for the multi-select `minimum_education_attainment` field. */
export const MINIMUM_EDUCATION_OPTIONS = [
  'No formal education required',
  'Elementary',
  'Junior High School',
  'Senior High School',
  'High School',
  'Vocational / Technical',
  'College Undergraduate',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
] as const;
