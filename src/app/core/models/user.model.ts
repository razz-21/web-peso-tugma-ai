import { z } from 'zod';

export const UserRoleSchema = z.enum(['super_admin', 'admin', 'officer']);

export const USER_ROLES = UserRoleSchema.options;

export const UserStatusSchema = z.enum(['active', 'inactive']);

export const USER_STATUSES = UserStatusSchema.options;

export const UserSchema = z.object({
  id: z.uuid(),
  fullname: z.string().min(1).max(100),
  email: z.email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  password: z.string().min(6).max(128),
  avatar: z.string().nullable(),
  workspace_id: z.uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserGetSchema = UserSchema.omit({ password: true });

export const UserPostSchema = UserSchema;

export const UserPatchSchema = UserSchema.omit({ id: true, created_at: true }).partial();

/**
 * Self-service profile update payload for `PATCH /me`. Mirrors the backend
 * `MePatch` schema — intentionally excludes `role` and `status`.
 */
export const MePatchSchema = UserSchema.pick({
  fullname: true,
  email: true,
  password: true,
  avatar: true,
}).partial();

export const UserListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(UserGetSchema),
});

export interface ListUsersParams {
  limit?: number;
  offset?: number;
  q?: string;
  role?: UserRole;
}

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserPost = z.infer<typeof UserPostSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type UserPatch = z.infer<typeof UserPatchSchema>;
export type MePatch = z.infer<typeof MePatchSchema>;
export type UserGet = z.infer<typeof UserGetSchema>;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  officer: 'Officer',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};
