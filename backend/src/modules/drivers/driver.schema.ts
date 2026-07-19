import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  licenseNumber: z.string().min(1).max(50).trim(),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E']),
  licenseExpiryDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  contactNumber: z.string().min(7).max(20),
  email: z.string().email(),
  safetyScore: z.number().min(0).max(100).default(80),
  tripCompletionRate: z.number().min(0).max(100).default(90),
  address: z.string().min(1).max(500),
  joinDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.enum(['available', 'on_trip', 'off_duty', 'suspended']).optional(),
  totalTrips: z.number().int().min(0).optional(),
});

export const driverQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['available', 'on_trip', 'off_duty', 'suspended']).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
