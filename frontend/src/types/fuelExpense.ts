export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometer: number;
  fuelStation?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  vehicleId: string;
  date: string;
  toll: number;
  otherExpenses: number;
  maintenanceCost: number;
  totalCost: number;
  description?: string;
  createdAt: string;
}

export interface VehicleCostBreakdown {
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
}
