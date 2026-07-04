import { z } from 'zod';

/** VARCHAR limits carried over from the backend companies schema. */
export const COMPANY_NAME_MAX = 30;
export const CONTACT_NUMBER_MAX = 13;

export const CompanyTypeSchema = z.enum([
  'sole_proprietorship',
  'partnership',
  'corporation',
  'cooperative',
  'government',
]);

export const COMPANY_TYPES = CompanyTypeSchema.options;

export const CompanySchema = z.object({
  id: z.uuid(),
  company_name: z.string().min(1).max(COMPANY_NAME_MAX),
  company_type: CompanyTypeSchema,
  email: z.email().nullable(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  contact_number: z.string().max(CONTACT_NUMBER_MAX).nullable(),
  avatar: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CompanyGetSchema = CompanySchema;

export const CompanyPostSchema = CompanySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const CompanyPatchSchema = CompanySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const CompanyListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(CompanyGetSchema),
});

export interface ListCompaniesParams {
  limit?: number;
  offset?: number;
  q?: string;
}

export type CompanyType = z.infer<typeof CompanyTypeSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CompanyGet = z.infer<typeof CompanyGetSchema>;
export type CompanyPost = z.infer<typeof CompanyPostSchema>;
export type CompanyPatch = z.infer<typeof CompanyPatchSchema>;
export type CompanyList = z.infer<typeof CompanyListSchema>;

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  sole_proprietorship: 'Sole Proprietorship',
  partnership: 'Partnership',
  corporation: 'Corporation',
  cooperative: 'Cooperative',
  government: 'Government',
};
