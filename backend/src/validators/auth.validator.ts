import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name cannot exceed 100 characters'),
});

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, 'Email or username is required')
    .describe('Can be email or username'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .max(500)
    .optional()
    .nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
