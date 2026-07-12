import { db } from './db';
import type { Vehicle } from '../types';

export async function getVehicles(): Promise<Vehicle[]> {
  await db.delay();
  return [...db.get().vehicles];
}

export async function getVehicle(id: string): Promise<Vehicle | undefined> {
  await db.delay();
  return db.get().vehicles.find((v) => v.id === id);
}

export async function createVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
  await db.delay();
  const existing = db.get().vehicles.find((v) => v.registrationNumber === data.registrationNumber);
  if (existing) throw new Error(`Registration number ${data.registrationNumber} already exists`);
  const vehicle: Vehicle = {
    ...data,
    id: `v${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.get().vehicles.push(vehicle);
  db.save();
  return vehicle;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  await db.delay();
  const idx = db.get().vehicles.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error('Vehicle not found');
  if (data.registrationNumber) {
    const dup = db.get().vehicles.find((v) => v.registrationNumber === data.registrationNumber && v.id !== id);
    if (dup) throw new Error(`Registration number ${data.registrationNumber} already exists`);
  }
  const updated = { ...db.get().vehicles[idx], ...data, updatedAt: new Date().toISOString() };
  db.get().vehicles[idx] = updated;
  db.save();
  return updated;
}

export async function deleteVehicle(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.vehicles = d.vehicles.filter((v) => v.id !== id);
  db.save();
}
