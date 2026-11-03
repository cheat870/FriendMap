import { z } from 'zod';

export const sendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Invalid user ID'),
  message: z.string().max(255).optional(),
});

export const sendFriendRequestSchema = sendRequestSchema;

export const respondRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const blockUserSchema = z.object({
  reason: z.string().max(255).optional(),
});

export const friendIdParamSchema = z.object({
  friendId: z.string().min(1, 'Invalid friend ID'),
});

export const requestIdParamSchema = z.object({
  requestId: z.string().min(1, 'Invalid request ID'),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'Invalid user ID'),
});

export type SendRequestInput = z.infer<typeof sendRequestSchema>;
export type RespondRequestInput = z.infer<typeof respondRequestSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
