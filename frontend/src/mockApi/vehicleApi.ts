import { api } from '../lib/apiClient';
import type { Vehicle } from '../types';

// Backend shape → frontend shape normalizer
function normalize(v: Record<string, unknown>): Vehicle {
  return {
    id: v.id as string,
    registrationNumber: v.registrationNumber as string,
    name: v.name as string,
    type: v.type as Vehicle['type'],
    maxLoadCapacity: v.maxLoadCapacity as number,
    odometer: v.odometer as number,
    acquisitionCost: v.acquisitionCost as number,
    revenue: (v.revenue as number) ?? 0,
    status: v.status as Vehicle['status'],
    region: v.region as string,
    make: v.make as string,
    model: v.model as string,
    year: v.year as number,
    color: v.color as string,
    fuelType: v.fuelType as Vehicle['fuelType'],
    documents: (v.documents as Vehicle['documents']) ?? [],
    createdAt: v.createdAt as string,
    updatedAt: v.updatedAt as string,
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  const data = await api.get<unknown[]>('/vehicles', { pageSize: 200 });
  return data.map((v) => normalize(v as Record<string, unknown>));
}

export async function getVehicle(id: string): Promise<Vehicle | undefined> {
  try {
    const data = await api.get<Record<string, unknown>>(`/vehicles/${id}`);
    return normalize(data);
  } catch {
    return undefined;
  }
}

export async function getAvailableVehicles(): Promise<Vehicle[]> {
  const data = await api.get<unknown[]>('/vehicles/available');
  return data.map((v) => normalize(v as Record<string, unknown>));
}

export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>,
): Promise<Vehicle> {
  const result = await api.post<Record<string, unknown>>('/vehicles', data);
  return normalize(result);
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const result = await api.put<Record<string, unknown>>(`/vehicles/${id}`, data);
  return normalize(result);
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
