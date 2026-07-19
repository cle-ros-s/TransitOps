import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.enum([
    'oil_change', 'tire_replacement', 'brake_service', 'engine_repair',
    'body_repair', 'electrical', 'ac_service', 'general_service', 'inspection',
  ]),
  description: z.string().min(1).max(1000),
  estimatedCost: z.number().min(0, 'Cost cannot be negative'),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  technician: z.string().max(100).optional(),
  workshopName: z.string().max(200).optional(),
});

export const closeMaintenanceSchema = z.object({
  actualCost: z.number().min(0, 'Actual cost cannot be negative'),
});

export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['active', 'completed']).optional(),
  vehicleId: z.string().optional(),
  serviceType: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type CloseMaintenanceInput = z.infer<typeof closeMaintenanceSchema>;
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
