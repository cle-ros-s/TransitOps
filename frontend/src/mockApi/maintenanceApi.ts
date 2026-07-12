import { db } from './db';
import type { MaintenanceRecord } from '../types';

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  await db.delay();
  return [...db.get().maintenance];
}

export async function createMaintenance(data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceRecord> {
  await db.delay();
  const d = db.get();
  const vIdx = d.vehicles.findIndex((v) => v.id === data.vehicleId);
  if (vIdx === -1) throw new Error('Vehicle not found');
  if (d.vehicles[vIdx].status !== 'available') {
    throw new Error('Only available vehicles can be sent to maintenance');
  }

  d.vehicles[vIdx] = { ...d.vehicles[vIdx], status: 'in_shop', updatedAt: new Date().toISOString() };

  const record: MaintenanceRecord = {
    ...data,
    id: `m${Date.now()}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  d.maintenance.push(record);
  db.save();
  return record;
}

export async function closeMaintenance(id: string, actualCost?: number): Promise<MaintenanceRecord> {
  await db.delay();
  const d = db.get();
  const idx = d.maintenance.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('Maintenance record not found');
  const record = d.maintenance[idx];

  const vIdx = d.vehicles.findIndex((v) => v.id === record.vehicleId);
  if (vIdx !== -1 && d.vehicles[vIdx].status !== 'retired') {
    d.vehicles[vIdx] = { ...d.vehicles[vIdx], status: 'available', updatedAt: new Date().toISOString() };
  }

  const now = new Date().toISOString();
  const updated: MaintenanceRecord = {
    ...record,
    status: 'completed',
    completedDate: now,
    actualCost: actualCost ?? record.estimatedCost,
    updatedAt: now,
  };
  d.maintenance[idx] = updated;
  db.save();
  return updated;
}

export async function updateMaintenance(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  await db.delay();
  const d = db.get();
  const idx = d.maintenance.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('Record not found');
  const updated = { ...d.maintenance[idx], ...data, updatedAt: new Date().toISOString() };
  d.maintenance[idx] = updated;
  db.save();
  return updated;
}

export async function deleteMaintenance(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.maintenance = d.maintenance.filter((m) => m.id !== id);
  db.save();
}
