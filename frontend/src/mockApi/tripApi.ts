import { db } from './db';
import type { Trip } from '../types';
import { createFuelLog } from './fuelExpenseApi';
import { createExpense } from './fuelExpenseApi';

export async function getTrips(): Promise<Trip[]> {
  await db.delay();
  return [...db.get().trips];
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  await db.delay();
  return db.get().trips.find((t) => t.id === id);
}

export async function createTrip(data: Omit<Trip, 'id' | 'tripNumber' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
  await db.delay();
  const tripCount = db.get().trips.length + 1;
  const trip: Trip = {
    ...data,
    id: `tr${Date.now()}`,
    tripNumber: `TR${String(tripCount).padStart(3, '0')}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.get().trips.push(trip);
  db.save();
  return trip;
}

export async function dispatchTrip(id: string): Promise<Trip> {
  await db.delay();
  const d = db.get();
  const tripIdx = d.trips.findIndex((t) => t.id === id);
  if (tripIdx === -1) throw new Error('Trip not found');
  const trip = d.trips[tripIdx];
  if (trip.status !== 'draft') throw new Error('Only draft trips can be dispatched');

  const vIdx = d.vehicles.findIndex((v) => v.id === trip.vehicleId);
  const drIdx = d.drivers.findIndex((dr) => dr.id === trip.driverId);
  if (vIdx !== -1) d.vehicles[vIdx] = { ...d.vehicles[vIdx], status: 'on_trip', updatedAt: new Date().toISOString() };
  if (drIdx !== -1) d.drivers[drIdx] = { ...d.drivers[drIdx], status: 'on_trip', updatedAt: new Date().toISOString() };

  const updated = { ...trip, status: 'dispatched' as const, updatedAt: new Date().toISOString() };
  d.trips[tripIdx] = updated;
  db.save();
  return updated;
}

export async function completeTrip(
  id: string,
  completion: { finalOdometer: number; fuelConsumed: number; toll?: number; otherExpenses?: number }
): Promise<Trip> {
  await db.delay();
  const d = db.get();
  const tripIdx = d.trips.findIndex((t) => t.id === id);
  if (tripIdx === -1) throw new Error('Trip not found');
  const trip = d.trips[tripIdx];
  if (trip.status !== 'dispatched') throw new Error('Only dispatched trips can be completed');

  const vIdx = d.vehicles.findIndex((v) => v.id === trip.vehicleId);
  const drIdx = d.drivers.findIndex((dr) => dr.id === trip.driverId);

  if (vIdx !== -1) {
    d.vehicles[vIdx] = {
      ...d.vehicles[vIdx],
      status: 'available',
      odometer: completion.finalOdometer,
      updatedAt: new Date().toISOString(),
    };
  }
  if (drIdx !== -1) {
    d.drivers[drIdx] = {
      ...d.drivers[drIdx],
      status: 'available',
      totalTrips: d.drivers[drIdx].totalTrips + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  const actualDistance = completion.finalOdometer - (vIdx !== -1 ? SEED_VEHICLES_ODOMETER_MAP[trip.vehicleId] ?? 0 : 0);
  const fuelCostPerLiter = 91.5;
  const fuelTotal = completion.fuelConsumed * fuelCostPerLiter;

  const now = new Date().toISOString();

  if (vIdx !== -1) {
    await createFuelLog({
      vehicleId: trip.vehicleId,
      tripId: trip.id,
      date: now,
      liters: completion.fuelConsumed,
      costPerLiter: fuelCostPerLiter,
      totalCost: fuelTotal,
      odometer: completion.finalOdometer,
      fuelStation: 'Auto-logged on trip completion',
    });
  }

  if ((completion.toll ?? 0) > 0 || (completion.otherExpenses ?? 0) > 0) {
    await createExpense({
      tripId: trip.id,
      vehicleId: trip.vehicleId,
      date: now,
      toll: completion.toll ?? 0,
      otherExpenses: completion.otherExpenses ?? 0,
      maintenanceCost: 0,
      totalCost: (completion.toll ?? 0) + (completion.otherExpenses ?? 0),
      description: 'Auto-logged on trip completion',
    });
  }

  const updated: Trip = {
    ...trip,
    status: 'completed',
    endDate: now,
    finalOdometer: completion.finalOdometer,
    fuelConsumed: completion.fuelConsumed,
    actualDistance,
    updatedAt: now,
  };
  d.trips[tripIdx] = updated;
  db.save();
  return updated;
}

const SEED_VEHICLES_ODOMETER_MAP: Record<string, number> = {
  v1: 45230, v2: 128450, v3: 22100, v4: 67800, v5: 235600, v6: 89000,
};

export async function cancelTrip(id: string, reason: string): Promise<Trip> {
  await db.delay();
  const d = db.get();
  const tripIdx = d.trips.findIndex((t) => t.id === id);
  if (tripIdx === -1) throw new Error('Trip not found');
  const trip = d.trips[tripIdx];
  if (!['draft', 'dispatched'].includes(trip.status)) throw new Error('Trip cannot be cancelled');

  if (trip.status === 'dispatched') {
    const vIdx = d.vehicles.findIndex((v) => v.id === trip.vehicleId);
    const drIdx = d.drivers.findIndex((dr) => dr.id === trip.driverId);
    if (vIdx !== -1) d.vehicles[vIdx] = { ...d.vehicles[vIdx], status: 'available', updatedAt: new Date().toISOString() };
    if (drIdx !== -1) d.drivers[drIdx] = { ...d.drivers[drIdx], status: 'available', updatedAt: new Date().toISOString() };
  }

  const updated: Trip = {
    ...trip,
    status: 'cancelled',
    cancellationReason: reason,
    updatedAt: new Date().toISOString(),
  };
  d.trips[tripIdx] = updated;
  db.save();
  return updated;
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
  await db.delay();
  const d = db.get();
  const idx = d.trips.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Trip not found');
  const updated = { ...d.trips[idx], ...data, updatedAt: new Date().toISOString() };
  d.trips[idx] = updated;
  db.save();
  return updated;
}

export async function deleteTrip(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.trips = d.trips.filter((t) => t.id !== id);
  db.save();
}
