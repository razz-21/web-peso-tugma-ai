import { z } from 'zod';

export const UserRoleSchema = z.enum(['super_admin', 'admin', 'officer']);

export const USER_ROLES = UserRoleSchema.options;

export const UserSchema = z.object({
  id: z.uuid(),
  fullname: z.string().min(1).max(100),
  email: z.email(),
  role: UserRoleSchema,
  password: z.string().min(6).max(128),
  avatar: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserGetSchema = UserSchema.omit({ password: true });

export const UserPostSchema = UserSchema;

export const UserPatchSchema = z.object({
  fullname: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: UserRoleSchema.optional(),
  avatar: z.string().nullable().optional(),
});

export const UserListSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(UserSchema),
});

export interface ListUsersParams {
  limit?: number;
  offset?: number;
}

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserPost = z.infer<typeof UserPostSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type UserPatch = z.infer<typeof UserPatchSchema>;
export type UserGet = z.infer<typeof UserGetSchema>;
