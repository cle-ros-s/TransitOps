import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
