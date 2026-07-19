import { api } from '../lib/apiClient';
import type { FuelLog, Expense } from '../types';

// ── Fuel Logs ─────────────────────────────────────────────────────────────────

function normalizeFuel(f: Record<string, unknown>): FuelLog {
  return {
    id: f.id as string,
    vehicleId: f.vehicleId as string,
    tripId: f.tripId as string | undefined,
    date: f.date as string,
    liters: f.liters as number,
    costPerLiter: f.costPerLiter as number,
    totalCost: f.totalCost as number,
    odometer: f.odometer as number,
    fuelStation: f.fuelStation as string | undefined,
    createdAt: f.createdAt as string,
  };
}

export async function getFuelLogs(): Promise<FuelLog[]> {
  const data = await api.get<unknown[]>('/fuel-logs', { pageSize: 200 });
  return data.map((f) => normalizeFuel(f as Record<string, unknown>));
}

export async function createFuelLog(
  data: Omit<FuelLog, 'id' | 'createdAt'>,
): Promise<FuelLog> {
  const result = await api.post<Record<string, unknown>>('/fuel-logs', data);
  return normalizeFuel(result);
}

export async function deleteFuelLog(id: string): Promise<void> {
  await api.delete(`/fuel-logs/${id}`);
}

// ── Expenses ──────────────────────────────────────────────────────────────────

function normalizeExpense(e: Record<string, unknown>): Expense {
  return {
    id: e.id as string,
    tripId: e.tripId as string,
    vehicleId: e.vehicleId as string,
    date: e.date as string,
    toll: e.toll as number,
    otherExpenses: e.otherExpenses as number,
    maintenanceCost: e.maintenanceCost as number,
    totalCost: e.totalCost as number,
    description: e.description as string | undefined,
    createdAt: e.createdAt as string,
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const data = await api.get<unknown[]>('/expenses', { pageSize: 200 });
  return data.map((e) => normalizeExpense(e as Record<string, unknown>));
}

export async function createExpense(
  data: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> {
  const result = await api.post<Record<string, unknown>>('/expenses', data);
  return normalizeExpense(result);
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

// ── Cost Breakdowns ───────────────────────────────────────────────────────────

export interface VehicleCostBreakdown {
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
}

export async function getCostBreakdowns(): Promise<VehicleCostBreakdown[]> {
  return api.get<VehicleCostBreakdown[]>('/expenses/cost-breakdowns');
}

// Alias — used by FuelExpensesPage and AnalyticsPage
export const getVehicleCostBreakdowns = getCostBreakdowns;

