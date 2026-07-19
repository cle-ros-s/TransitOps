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
  const result = await api.patch<Record<string, unknown>>(
    `/trips/${id}/dispatch`,
  );
  return normalize(result);
}

export async function completeTrip(
  id: string,
  completion: {
    finalOdometer: number;
    fuelConsumed: number;
    toll?: number;
    otherExpenses?: number;
    actualDistance?: number;
  },
): Promise<Trip> {
  const result = await api.patch<Record<string, unknown>>(
    `/trips/${id}/complete`,
    completion,
  );
  return normalize(result);
}

export async function cancelTrip(
  id: string,
  cancellationReason: string,
): Promise<Trip> {
  const result = await api.patch<Record<string, unknown>>(
    `/trips/${id}/cancel`,
    { cancellationReason },
  );
  return normalize(result);
}

export async function updateTrip(
  id: string,
  data: Partial<Trip>,
): Promise<Trip> {
  const result = await api.put<Record<string, unknown>>(
    `/trips/${id}`,
    data,
  );
  return normalize(result);
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}