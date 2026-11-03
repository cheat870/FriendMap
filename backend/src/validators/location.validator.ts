import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  accuracy: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
});

export const locationUpdateSchema = updateLocationSchema;

export const updateSharingSchema = z.object({
  isActive: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const friendLocationParamSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateSharingInput = z.infer<typeof updateSharingSchema>;
