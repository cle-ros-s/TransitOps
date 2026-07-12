export type TripStatus = 'draft' | 'dispatched' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // kg
  plannedDistance: number; // km
  actualDistance?: number; // km
  revenue: number;
  status: TripStatus;
  startDate: string;
  endDate?: string;
  fuelConsumed?: number; // liters
  finalOdometer?: number;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
