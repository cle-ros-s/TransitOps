import { api } from '../lib/apiClient';

// ── Dashboard Stats ───────────────────────────────────────────────────────────

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

interface RawDashboardStats {
  vehicles: {
    total: number;
    available: number;
    onTrip: number;
    inShop: number;
    retired: number;
  };
  drivers: {
    total: number;
    available: number;
    onTrip: number;
    offDuty: number;
    suspended: number;
  };
  trips: {
    total: number;
    draft: number;
    dispatched: number;
    completed: number;
    cancelled: number;
  };
  maintenance: { active: number; completed: number };
  financials: {
    totalRevenue: number;
    totalFuelCost: number;
    totalExpenses: number;
  };
  alerts: { expiringLicenses: number; activeMaintenance: number };
  fleetUtilization: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const raw = await api.get<RawDashboardStats>('/dashboard/stats');
  return {
    totalVehicles: raw.vehicles.total,
    activeVehicles: raw.vehicles.onTrip,
    availableVehicles: raw.vehicles.available,
    inMaintenanceVehicles: raw.vehicles.inShop,
    retiredVehicles: raw.vehicles.retired,
    activeTrips: raw.trips.dispatched,
    pendingTrips: raw.trips.draft,
    driversOnDuty: raw.drivers.onTrip,
    fleetUtilization: raw.fleetUtilization,
    totalRevenue: raw.financials.totalRevenue,
    totalExpenses: raw.financials.totalFuelCost + raw.financials.totalExpenses,
    operationalCost: raw.financials.totalFuelCost + raw.financials.totalExpenses,
  };
}

// ── Monthly Trends ────────────────────────────────────────────────────────────

export interface MonthlyTrend {
  month: string;
  trips: number;
  revenue: number;
  fuel: number;
  expenses?: number;
}

export async function getMonthlyTrends(months = 6): Promise<MonthlyTrend[]> {
  const data = await api.get<MonthlyTrend[]>('/analytics/monthly-trends', { months });
  return data;
}

// ── Fleet Health ──────────────────────────────────────────────────────────────

export interface FleetHealth {
  expiringLicenses: Array<{
    id: string;
    name: string;
    licenseNumber: string;
    licenseExpiryDate: string;
    status: string;
  }>;
  activeMaintenance: Array<{
    id: string;
    serviceType: string;
    scheduledDate: string;
    estimatedCost: number;
    vehicle: { registrationNumber: string; name: string };
  }>;
}

export async function getFleetHealth(): Promise<FleetHealth> {
  return api.get<FleetHealth>('/dashboard/fleet-health');
}

// ── Recent Activity ───────────────────────────────────────────────────────────

export interface RecentActivity {
  recentTrips: Array<{
    id: string;
    tripNumber: string;
    status: string;
    source: string;
    destination: string;
    updatedAt: string;
    vehicle: { registrationNumber: string };
    driver: { name: string };
  }>;
  recentMaintenance: Array<{
    id: string;
    serviceType: string;
    status: string;
    updatedAt: string;
    vehicle: { registrationNumber: string };
  }>;
}

export async function getRecentActivity(): Promise<RecentActivity> {
  return api.get<RecentActivity>('/dashboard/recent-activity');
}

// ── Vehicle Performance ───────────────────────────────────────────────────────

export interface VehiclePerformance {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  totalTrips: number;
  totalRevenue: number;
  totalFuelCost: number;
  roi: number;
}

export async function getVehiclePerformance(): Promise<VehiclePerformance[]> {
  return api.get<VehiclePerformance[]>('/analytics/vehicle-performance');
}

// ── Driver Performance ────────────────────────────────────────────────────────

export interface DriverPerformance {
  driverId: string;
  name: string;
  totalTrips: number;
  safetyScore: number;
  tripCompletionRate: number;
}

export async function getDriverPerformance(): Promise<DriverPerformance[]> {
  return api.get<DriverPerformance[]>('/analytics/driver-performance');
}

// ── Maintenance Costs ─────────────────────────────────────────────────────────

export interface MaintenanceCostBreakdown {
  serviceType: string;
  count: number;
  totalCost: number;
  avgCost: number;
}

export async function getMaintenanceCosts(): Promise<MaintenanceCostBreakdown[]> {
  return api.get<MaintenanceCostBreakdown[]>('/analytics/maintenance-costs');
}
