import { z } from 'zod';

export const createTripSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle is required'),
    driverId: z.string().min(1, 'Driver is required'),
    source: z.string().min(1).max(200).trim(),
    destination: z.string().min(1).max(200).trim(),
    cargoWeight: z.number().positive('Cargo weight must be positive'),
    plannedDistance: z.number().positive('Planned distance must be greater than zero'),
    revenue: z.number().min(0).default(0),
    startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.source.toLowerCase().trim() !== d.destination.toLowerCase().trim(), {
    message: 'Source and destination cannot be the same',
    path: ['destination'],
  });

export const completeTripSchema = z.object({
  finalOdometer: z.number().positive('Final odometer must be positive'),
  fuelConsumed: z.number().positive('Fuel consumed must be positive'),
  toll: z.number().min(0).default(0),
  otherExpenses: z.number().min(0).default(0),
  actualDistance: z.number().positive().optional(),
});

export const cancelTripSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export const tripQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['draft', 'dispatched', 'completed', 'cancelled']).optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
export type TripQueryInput = z.infer<typeof tripQuerySchema>;
