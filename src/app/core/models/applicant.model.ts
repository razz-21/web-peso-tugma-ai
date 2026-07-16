import { z } from 'zod';

/** Character limit carried over from the backend applicants schema. */
export const NAME_MAX = 100;

export const SexSchema = z.enum(['Male', 'Female']);
export const SEXES = SexSchema.options;

/** Selectable employment status options shown in applicant forms. Stored as a
 *  free-form string on the backend, so this list is UI-only guidance. */
export const EMPLOYMENT_STATUSES = [
  'Employed',
  'Unemployed',
  'Self-employed',
  'Underemployed',
  'New Entrant / Fresh Graduate',
  'Finished Contract',
  'Resigned',
  'Retired',
  'Terminated / Laid off',
] as const;

export const AddressSchema = z.object({
  id: z.uuid().optional(),
  province: z.string().nullable().optional(),
  municipality_city: z.string().nullable().optional(),
  baranggay: z.string().nullable().optional(),
  house_no_street: z.string().nullable().optional(),
});

export const OccupationIndustrySchema = z.object({
  id: z.uuid().optional(),
  occupation: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
});

export const EducationalBackgroundSchema = z.object({
  current_in_school: z.boolean().default(false),
  highest_education_level: z.string().nullable().optional(),
  year_graduated: z.string().nullable().optional(),
  last_attended: z.string().nullable().optional(),
  school_university: z.string().nullable().optional(),
  course_program: z.string().nullable().optional(),
});

export const TrainingSchema = z.object({
  id: z.uuid().optional(),
  training_title: z.string().nullable().optional(),
  duration_start: z.string().nullable().optional(),
  duration_end: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  certificate_received: z.string().nullable().optional(),
  completed: z.boolean().default(false),
});

export const EligibilitySchema = z.object({
  id: z.uuid().optional(),
  title: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
});

export const WorkExperienceSchema = z.object({
  id: z.uuid().optional(),
  company: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status_of_appointment: z.string().nullable().optional(),
});

export const ApplicantSchema = z.object({
  id: z.uuid(),
  firstname: z.string().min(1).max(NAME_MAX),
  lastname: z.string().min(1).max(NAME_MAX),
  middlename: z.string().nullable(),
  suffix: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  sex: SexSchema.nullable(),
  citizenship: z.string().nullable(),
  height_in_cm: z.number().nullable(),
  weight_in_kg: z.number().nullable(),
  present_address: AddressSchema,
  permanent_address: AddressSchema.nullable(),
  primary_mobile_number: z.string().nullable(),
  secondary_mobile_number: z.string().nullable(),
  email_address: z.email().nullable(),
  employment_status: z.string().nullable(),
  preferred_occupation_industry: z.array(OccupationIndustrySchema),
  preferred_work_location: z.array(z.string()),
  salary_expectation: z.string().nullable(),
  educational_background: EducationalBackgroundSchema.nullable(),
  trainings: z.array(TrainingSchema),
  eligibility: z.array(EligibilitySchema),
  work_experience: z.array(WorkExperienceSchema),
  technical_skills: z.array(z.string()),
  created_by: z.uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ApplicantGetSchema = ApplicantSchema;

/** Payload for POST /applicants — server generates id/audit fields. */
export const ApplicantPostSchema = z.object({
  firstname: z.string().min(1).max(NAME_MAX),
  lastname: z.string().min(1).max(NAME_MAX),
  middlename: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  sex: SexSchema.nullable().optional(),
  citizenship: z.string().nullable().optional(),
  height_in_cm: z.number().nullable().optional(),
  weight_in_kg: z.number().nullable().optional(),
  present_address: AddressSchema.optional(),
  permanent_address: AddressSchema.nullable().optional(),
  primary_mobile_number: z.string().nullable().optional(),
  secondary_mobile_number: z.string().nullable().optional(),
  email_address: z.email().nullable().optional(),
  employment_status: z.string().nullable().optional(),
  preferred_occupation_industry: z.array(OccupationIndustrySchema).optional(),
  preferred_work_location: z.array(z.string()).optional(),
  salary_expectation: z.string().nullable().optional(),
  educational_background: EducationalBackgroundSchema.nullable().optional(),
  trainings: z.array(TrainingSchema).optional(),
  eligibility: z.array(EligibilitySchema).optional(),
  work_experience: z.array(WorkExperienceSchema).optional(),
  technical_skills: z.array(z.string()).optional(),
});

/** Payload for PATCH /applicants/:id — every field optional (partial update). */
export const ApplicantPatchSchema = ApplicantPostSchema.partial();

export const ApplicantListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(ApplicantGetSchema),
});

export interface ListApplicantsParams {
  limit?: number;
  offset?: number;
  q?: string;
}

export type Sex = z.infer<typeof SexSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type OccupationIndustry = z.infer<typeof OccupationIndustrySchema>;
export type EducationalBackground = z.infer<typeof EducationalBackgroundSchema>;
export type Training = z.infer<typeof TrainingSchema>;
export type Eligibility = z.infer<typeof EligibilitySchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Applicant = z.infer<typeof ApplicantSchema>;
export type ApplicantGet = z.infer<typeof ApplicantGetSchema>;
export type ApplicantPost = z.infer<typeof ApplicantPostSchema>;
export type ApplicantPatch = z.infer<typeof ApplicantPatchSchema>;
export type ApplicantList = z.infer<typeof ApplicantListSchema>;
