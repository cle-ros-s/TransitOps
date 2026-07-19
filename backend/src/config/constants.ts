export const TRIP_NUMBER_PREFIX = 'TR';
export const MIN_PASSWORD_LENGTH = 8;
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const VEHICLE_TYPES = ['van', 'truck', 'mini', 'bus', 'trailer'] as const;
export const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired'] as const;
export const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'] as const;
export const TRIP_STATUSES = ['draft', 'dispatched', 'completed', 'cancelled'] as const;
export const MAINTENANCE_STATUSES = ['active', 'completed'] as const;
export const SERVICE_TYPES = [
  'oil_change', 'tire_replacement', 'brake_service', 'engine_repair',
  'body_repair', 'electrical', 'ac_service', 'general_service', 'inspection',
] as const;
export const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'] as const;
export const FUEL_TYPES = ['diesel', 'petrol', 'cng', 'electric'] as const;
export const DOC_TYPES = ['insurance', 'permit', 'registration', 'pollution'] as const;
export const REGIONS = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central'] as const;

export const USER_ROLES = [
  'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst',
] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
