import type { UserRole } from '../types';

export const APP_NAME = 'TransitOps';
export const APP_VERSION = '1.0.0';
export const SESSION_KEY = 'transitops_session';
export const SETTINGS_KEY = 'transitops_settings';
export const DB_KEY = 'transitops_db';

export const ROLES: Record<UserRole, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  fleet_manager: ['vehicles', 'drivers', 'maintenance', 'analytics', 'dashboard', 'trips_view'],
  dispatcher: ['trips', 'vehicles_view', 'dashboard'],
  safety_officer: ['drivers', 'trips_view', 'dashboard'],
  financial_analyst: ['fuel', 'expenses', 'reports', 'analytics', 'dashboard'],
};

export const VEHICLE_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'on_trip', label: 'On Trip', color: 'blue' },
  { value: 'in_shop', label: 'In Shop', color: 'yellow' },
  { value: 'retired', label: 'Retired', color: 'red' },
] as const;

export const DRIVER_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'on_trip', label: 'On Trip', color: 'blue' },
  { value: 'off_duty', label: 'Off Duty', color: 'gray' },
  { value: 'suspended', label: 'Suspended', color: 'red' },
] as const;

export const TRIP_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'dispatched', label: 'Dispatched', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

export const VEHICLE_TYPES = [
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'mini', label: 'Mini' },
  { value: 'bus', label: 'Bus' },
  { value: 'trailer', label: 'Trailer' },
] as const;

export const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_replacement', label: 'Tire Replacement' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'engine_repair', label: 'Engine Repair' },
  { value: 'body_repair', label: 'Body Repair' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'ac_service', label: 'AC Service' },
  { value: 'general_service', label: 'General Service' },
  { value: 'inspection', label: 'Inspection' },
] as const;

export const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'] as const;

export const REGIONS = [
  'North Zone',
  'South Zone',
  'East Zone',
  'West Zone',
  'Central',
] as const;

export const DEMO_USERS = [
  {
    email: 'fleet@transitops.com',
    password: 'fleet123',
    role: 'fleet_manager' as UserRole,
    name: 'Fleet Manager',
  },
  {
    email: 'dispatch@transitops.com',
    password: 'dispatch123',
    role: 'dispatcher' as UserRole,
    name: 'Dispatcher',
  },
  {
    email: 'safety@transitops.com',
    password: 'safety123',
    role: 'safety_officer' as UserRole,
    name: 'Safety Officer',
  },
  {
    email: 'finance@transitops.com',
    password: 'finance123',
    role: 'financial_analyst' as UserRole,
    name: 'Financial Analyst',
  },
];

export const LICENSE_EXPIRY_THRESHOLD_DAYS = 30;
