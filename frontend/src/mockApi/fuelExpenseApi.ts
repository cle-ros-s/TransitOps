import { db } from './db';
import type { FuelLog, Expense, VehicleCostBreakdown } from '../types';

export async function getFuelLogs(): Promise<FuelLog[]> {
  await db.delay();
  return [...db.get().fuelLogs];
}

export async function createFuelLog(data: Omit<FuelLog, 'id' | 'createdAt'>): Promise<FuelLog> {
  await db.delay();
  const log: FuelLog = {
    ...data,
    id: `fl${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.get().fuelLogs.push(log);
  db.save();
  return log;
}

export async function deleteFuelLog(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.fuelLogs = d.fuelLogs.filter((f) => f.id !== id);
  db.save();
}

export async function getExpenses(): Promise<Expense[]> {
  await db.delay();
  return [...db.get().expenses];
}

export async function createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  await db.delay();
  const expense: Expense = {
    ...data,
    id: `ex${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.get().expenses.push(expense);
  db.save();
  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await db.delay();
  const d = db.get();
  d.expenses = d.expenses.filter((e) => e.id !== id);
  db.save();
}

export async function getVehicleCostBreakdowns(): Promise<VehicleCostBreakdown[]> {
  await db.delay();
  const d = db.get();
  return d.vehicles.map((v) => {
    const fuelLogs = d.fuelLogs.filter((f) => f.vehicleId === v.id);
    const expenses = d.expenses.filter((e) => e.vehicleId === v.id);
    const maintenances = d.maintenance.filter((m) => m.vehicleId === v.id && m.status === 'completed');
    const fuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
    const maintenanceCost = maintenances.reduce((sum, m) => sum + (m.actualCost ?? m.estimatedCost), 0);
    const otherCost = expenses.reduce((sum, e) => sum + e.toll + e.otherExpenses, 0);
    const totalCost = fuelCost + maintenanceCost + otherCost;
    return {
      vehicleId: v.id,
      vehicleName: v.name,
      registrationNumber: v.registrationNumber,
      fuelCost,
      maintenanceCost,
      otherCost,
      totalCost,
      revenue: v.revenue,
      profit: v.revenue - totalCost,
    };
  });
}
