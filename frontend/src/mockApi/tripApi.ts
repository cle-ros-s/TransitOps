import { api } from '../lib/apiClient';
import type { Trip } from '../types';

function normalize(t: Record<string, unknown>): Trip {
  const vehicle = t.vehicle as Record<string, unknown> | undefined;
  const driver = t.driver as Record<string, unknown> | undefined;
  return {
    id: t.id as string,
    tripNumber: t.tripNumber as string,
    source: t.source as string,
    destination: t.destination as string,
    vehicleId: (t.vehicleId ?? vehicle?.id) as string,
    driverId: (t.driverId ?? driver?.id) as string,
    cargoWeight: t.cargoWeight as number,
    plannedDistance: t.plannedDistance as number,
    actualDistance: t.actualDistance as number | undefined,
    revenue: (t.revenue as number) ?? 0,
    status: t.status as Trip['status'],
    startDate: t.startDate as string,
    endDate: t.endDate as string | undefined,
    fuelConsumed: t.fuelConsumed as number | undefined,
    finalOdometer: t.finalOdometer as number | undefined,
    cancellationReason: t.cancellationReason as string | undefined,
    notes: t.notes as string | undefined,
    createdAt: t.createdAt as string,
    updatedAt: t.updatedAt as string,
  };
}

export async function getTrips(): Promise<Trip[]> {
  const data = await api.get<unknown[]>('/trips', { pageSize: 200 });
  return data.map((t) => normalize(t as Record<string, unknown>));
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  try {
    const data = await api.get<Record<string, unknown>>(`/trips/${id}`);
    return normalize(data);
  } catch {
    return undefined;
  }
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'tripNumber' | 'createdAt' | 'updatedAt'>,
): Promise<Trip> {
  const result = await api.post<Record<string, unknown>>('/trips', data);
  return normalize(result);
}

export async function dispatchTrip(id: string): Promise<Trip> {
  const result = await api.patch<Record<string, unknown>>(`/trips/${id}/dispatch`);
  return normalize(result);
}

export async function completeTrip(
  id: string,
<<<<<<< HEAD
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
=======
  completion: {
    finalOdometer: number;
    fuelConsumed: number;
    toll?: number;
    otherExpenses?: number;
    actualDistance?: number;
  },
): Promise<Trip> {
  const result = await api.patch<Record<string, unknown>>(`/trips/${id}/complete`, completion);
  return normalize(result);
}

export async function cancelTrip(id: string, cancellationReason: string): Promise<Trip> {
  const result = await api.patch<Record<string, unknown>>(`/trips/${id}/cancel`, {
    cancellationReason,
  });
  return normalize(result);
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
  const result = await api.put<Record<string, unknown>>(`/trips/${id}`, data);
  return normalize(result);
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
>>>>>>> 53edb4a (Added TransitOps frontend and backend updates)
}
