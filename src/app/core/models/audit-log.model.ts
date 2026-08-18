import { z } from 'zod';

/** The resource an audit event acted on; drives the filter chips. */
export const AuditEntitySchema = z.enum([
  'company',
  'job',
  'referrals',
  'applicants',
  'settings',
  'security',
  'workspaces',
]);

/** Visual tone applied to an entry's icon tile and category chip. */
export const AuditToneSchema = z.enum(['red', 'green', 'amber', 'grey']);

/** A record referenced by an event, rendered as an inline highlighted name. */
export const AuditRecordSchema = z.object({
  label: z.string(),
});

/** A before → after change shown inside an event's detail block. */
export const AuditDiffRowSchema = z.object({
  label: z.string(),
  from: z.string(),
  to: z.string(),
});

export const AuditLogSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid().nullable(),
  entity: AuditEntitySchema,
  entity_label: z.string(),
  icon: z.string(),
  icon_tone: AuditToneSchema,
  chip_tone: AuditToneSchema,
  actor: z.string(),
  action: z.string(),
  records: z.array(AuditRecordSchema),
  meta: z.array(z.string()),
  note: z.string().nullable(),
  diff: z.array(AuditDiffRowSchema),
  created_at: z.string(),
});

export const AuditLogListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(AuditLogSchema),
});

export interface ListAuditLogsParams {
  limit?: number;
  offset?: number;
  entity?: AuditEntity;
  q?: string;
}

export type AuditEntity = z.infer<typeof AuditEntitySchema>;
export type AuditTone = z.infer<typeof AuditToneSchema>;
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
export type AuditDiffRow = z.infer<typeof AuditDiffRowSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogList = z.infer<typeof AuditLogListSchema>;
