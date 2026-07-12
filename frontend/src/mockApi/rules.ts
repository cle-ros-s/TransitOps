import type { Vehicle, Driver } from '../types';

export function isVehicleDispatchable(v: Vehicle): boolean {
  return v.status === 'available';
}

export function isDriverDispatchable(d: Driver, today = new Date()): boolean {
  if (d.status !== 'available') return false;
  const expiry = new Date(d.licenseExpiryDate);
  if (expiry < today) return false;
  return true;
}

export function validateCargoWeight(cargoWeight: number, vehicleCapacity: number): { valid: boolean; excessKg: number } {
  const excess = cargoWeight - vehicleCapacity;
  return { valid: excess <= 0, excessKg: excess };
}

export function canCreateMaintenance(v: Vehicle): boolean {
  return v.status === 'available';
}

export function canCloseMaintenance(v: Vehicle): boolean {
  return v.status === 'in_shop';
}
