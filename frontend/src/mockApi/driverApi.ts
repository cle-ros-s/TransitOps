import { db } from './db';
import type { Driver } from '../types';

export async function getDrivers(): Promise<Driver[]> {
  await db.delay();
  return [...db.get().drivers];
}

export async function getDriver(id: string): Promise<Driver | undefined> {
  await db.delay();
  return db.get().drivers.find((d) => d.id === id);
}

export async function createDriver(data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<Driver> {
  await db.delay();
  const existing = db.get().drivers.find((d) => d.licenseNumber === data.licenseNumber);
  if (existing) throw new Error(`License number ${data.licenseNumber} already exists`);
  const driver: Driver = {
    ...data,
    id: `dr${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.get().drivers.push(driver);
  db.save();
  return driver;
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  await db.delay();
  const idx = db.get().drivers.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Driver not found');
  const updated = { ...db.get().drivers[idx], ...data, updatedAt: new Date().toISOString() };
  db.get().drivers[idx] = updated;
  db.save();
  return updated;
}

export async function deleteDriver(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.drivers = d.drivers.filter((dr) => dr.id !== id);
  db.save();
}
