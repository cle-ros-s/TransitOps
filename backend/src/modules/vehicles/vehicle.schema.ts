import { z } from 'zod';

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1).toUpperCase().trim(),
  name: z.string().min(1).max(100).trim(),
  type: z.enum(['van', 'truck', 'mini', 'bus', 'trailer']),
  maxLoadCapacity: z.number().positive('Capacity must be positive'),
  odometer: z.number().min(0).default(0),
  acquisitionCost: z.number().min(0),
  region: z.string().min(1),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1).max(30),
  fuelType: z.enum(['diesel', 'petrol', 'cng', 'electric']),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(['available', 'on_trip', 'in_shop', 'retired']).optional(),
  revenue: z.number().min(0).optional(),
});

export const vehicleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['available', 'on_trip', 'in_shop', 'retired']).optional(),
  type: z.enum(['van', 'truck', 'mini', 'bus', 'trailer']).optional(),
  region: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
