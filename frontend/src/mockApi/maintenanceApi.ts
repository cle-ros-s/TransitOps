import { api } from '../lib/apiClient';
import type { MaintenanceRecord } from '../types';

function normalize(m: Record<string, unknown>): MaintenanceRecord {
  return {
    id: m.id as string,
    vehicleId: m.vehicleId as string,
    serviceType: m.serviceType as MaintenanceRecord['serviceType'],
    description: m.description as string,
    estimatedCost: m.estimatedCost as number,
    actualCost: m.actualCost as number | undefined,
    scheduledDate: m.scheduledDate as string,
    completedDate: m.completedDate as string | undefined,
    status: m.status as MaintenanceRecord['status'],
    technician: m.technician as string | undefined,
    workshopName: m.workshopName as string | undefined,
    createdAt: m.createdAt as string,
    updatedAt: m.updatedAt as string,
  };
}

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const data = await api.get<unknown[]>('/maintenance', { pageSize: 200 });
  return data.map((m) => normalize(m as Record<string, unknown>));
}

export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined> {
  try {
    const data = await api.get<Record<string, unknown>>(`/maintenance/${id}`);
    return normalize(data);
  } catch {
    return undefined;
  }
}

export async function createMaintenance(
  data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<MaintenanceRecord> {
  const result = await api.post<Record<string, unknown>>('/maintenance', data);
  return normalize(result);
}

export async function closeMaintenance(id: string, actualCost: number): Promise<MaintenanceRecord> {
  const result = await api.patch<Record<string, unknown>>(`/maintenance/${id}/close`, {
    actualCost,
  });
  return normalize(result);
}

export async function deleteMaintenance(id: string): Promise<void> {
  await api.delete(`/maintenance/${id}`);
}

// Alias used by some existing component names
export const createMaintenanceRecord = createMaintenance;
export const updateMaintenanceRecord = closeMaintenance;
