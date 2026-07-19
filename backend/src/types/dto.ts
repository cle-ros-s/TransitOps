import type {
  VehicleStatus, VehicleType, FuelType, DocType,
  DriverStatus, LicenseCategory,
  TripStatus, MaintenanceStatus, ServiceType,
  NotificationType, UserRole,
} from '@prisma/client';

// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthTokensDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department: string;
  };
}

// ── Vehicle ───────────────────────────────────────────────────────────────
export interface CreateVehicleDto {
  registrationNumber: string;
  name: string;
  type: VehicleType;
  maxLoadCapacity: number;
  odometer?: number;
  acquisitionCost: number;
  region: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: FuelType;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  status?: VehicleStatus;
  revenue?: number;
}

// ── Driver ────────────────────────────────────────────────────────────────
export interface CreateDriverDto {
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: string;
  contactNumber: string;
  email: string;
  safetyScore?: number;
  tripCompletionRate?: number;
  address: string;
  joinDate: string;
}

export interface UpdateDriverDto extends Partial<CreateDriverDto> {
  status?: DriverStatus;
  totalTrips?: number;
}

// ── Trip ──────────────────────────────────────────────────────────────────
export interface CreateTripDto {
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  revenue?: number;
  startDate: string;
  notes?: string;
}

export interface CompleteTripDto {
  finalOdometer: number;
  fuelConsumed: number;
  toll?: number;
  otherExpenses?: number;
  actualDistance?: number;
}

export interface CancelTripDto {
  cancellationReason: string;
}

// ── Maintenance ───────────────────────────────────────────────────────────
export interface CreateMaintenanceDto {
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  estimatedCost: number;
  scheduledDate: string;
  technician?: string;
  workshopName?: string;
}

export interface CloseMaintenanceDto {
  actualCost: number;
}

// ── Fuel Log ──────────────────────────────────────────────────────────────
export interface CreateFuelLogDto {
  vehicleId: string;
  tripId?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  odometer: number;
  fuelStation?: string;
}

// ── Expense ───────────────────────────────────────────────────────────────
export interface CreateExpenseDto {
  tripId: string;
  vehicleId: string;
  date: string;
  toll?: number;
  otherExpenses?: number;
  maintenanceCost?: number;
  description?: string;
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface PaginatedQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  region?: string;
}
