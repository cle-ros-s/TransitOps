import { api } from '../lib/apiClient';
import type { Driver } from '../types';

function normalize(d: Record<string, unknown>): Driver {
  return {
    id: d.id as string,
    name: d.name as string,
    licenseNumber: d.licenseNumber as string,
    licenseCategory: d.licenseCategory as Driver['licenseCategory'],
    licenseExpiryDate: d.licenseExpiryDate as string,
    contactNumber: d.contactNumber as string,
    email: d.email as string,
    safetyScore: (d.safetyScore as number) ?? 100,
    tripCompletionRate: (d.tripCompletionRate as number) ?? 100,
    status: d.status as Driver['status'],
    address: d.address as string,
    joinDate: d.joinDate as string,
    totalTrips: (d.totalTrips as number) ?? 0,
    createdAt: d.createdAt as string,
    updatedAt: d.updatedAt as string,
  };
}

export async function getDrivers(): Promise<Driver[]> {
  const data = await api.get<unknown[]>('/drivers', { pageSize: 200 });
  return data.map((d) => normalize(d as Record<string, unknown>));
}

export async function getDriver(id: string): Promise<Driver | undefined> {
  try {
    const data = await api.get<Record<string, unknown>>(`/drivers/${id}`);
    return normalize(data);
  } catch {
    return undefined;
  }
}

export async function getAvailableDrivers(): Promise<Driver[]> {
  const data = await api.get<unknown[]>('/drivers/available');
  return data.map((d) => normalize(d as Record<string, unknown>));
}

export async function createDriver(
  data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Driver> {
  const result = await api.post<Record<string, unknown>>('/drivers', data);
  return normalize(result);
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  const result = await api.put<Record<string, unknown>>(`/drivers/${id}`, data);
  return normalize(result);
}

export async function deleteDriver(id: string): Promise<void> {
  await api.delete(`/drivers/${id}`);
}
