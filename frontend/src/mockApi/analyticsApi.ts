import { db } from './db';

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  inMaintenanceVehicles: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
  totalRevenue: number;
  totalExpenses: number;
  operationalCost: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await db.delay(100);
  const d = db.get();
  const vehicles = d.vehicles;
  const trips = d.trips;
  const drivers = d.drivers;
  const fuelLogs = d.fuelLogs;
  const expenses = d.expenses;
  const maintenance = d.maintenance;

  const activeVehicles = vehicles.filter((v) => v.status === 'on_trip').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const inMaintenanceVehicles = vehicles.filter((v) => v.status === 'in_shop').length;
  const retiredVehicles = vehicles.filter((v) => v.status === 'retired').length;
  const activeTrips = trips.filter((t) => t.status === 'dispatched').length;
  const pendingTrips = trips.filter((t) => t.status === 'draft').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'on_trip').length;
  const nonRetired = activeVehicles + availableVehicles + inMaintenanceVehicles;
  const fleetUtilization = nonRetired > 0 ? Math.round(((activeVehicles + inMaintenanceVehicles) / nonRetired) * 100) : 0;
  const totalRevenue = vehicles.reduce((sum, v) => sum + v.revenue, 0);
  const fuelTotal = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
  const maintenanceTotal = maintenance.filter(m => m.status === 'completed').reduce((sum, m) => sum + (m.actualCost ?? m.estimatedCost), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.totalCost, 0);
  const operationalCost = fuelTotal + maintenanceTotal + expenseTotal;

  return {
    totalVehicles: vehicles.length,
    activeVehicles,
    availableVehicles,
    inMaintenanceVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
    totalRevenue,
    totalExpenses: operationalCost,
    operationalCost,
  };
}

export interface MonthlyTrend { month: string; trips: number; revenue: number; fuel: number; }

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  await db.delay(100);
  return [
    { month: 'Jan', trips: 42, revenue: 1250000, fuel: 380000 },
    { month: 'Feb', trips: 38, revenue: 1100000, fuel: 340000 },
    { month: 'Mar', trips: 55, revenue: 1620000, fuel: 490000 },
    { month: 'Apr', trips: 48, revenue: 1380000, fuel: 420000 },
    { month: 'May', trips: 61, revenue: 1820000, fuel: 560000 },
    { month: 'Jun', trips: 52, revenue: 1540000, fuel: 470000 },
    { month: 'Jul', trips: 44, revenue: 1290000, fuel: 395000 },
  ];
}
