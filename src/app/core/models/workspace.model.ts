import { z } from 'zod';

export const WorkspaceStatusSchema = z.enum(['active', 'inactive']);

export const WORKSPACE_STATUSES = WorkspaceStatusSchema.options;

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  status: WorkspaceStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const WorkspaceGetSchema = WorkspaceSchema;

export const WorkspacePostSchema = WorkspaceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const WorkspacePatchSchema = WorkspaceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const WorkspaceListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(WorkspaceGetSchema),
});

export interface ListWorkspacesParams {
  limit?: number;
  offset?: number;
  q?: string;
}

export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceGet = z.infer<typeof WorkspaceGetSchema>;
export type WorkspacePost = z.infer<typeof WorkspacePostSchema>;
export type WorkspacePatch = z.infer<typeof WorkspacePatchSchema>;
export type WorkspaceList = z.infer<typeof WorkspaceListSchema>;

export const WORKSPACE_STATUS_LABELS: Record<WorkspaceStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};
