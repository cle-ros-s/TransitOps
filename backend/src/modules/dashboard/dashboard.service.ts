import { prisma } from '../../config/prismaClient';
import { env } from '../../config/env';

export class DashboardService {
  async getStats() {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + env.LICENSE_EXPIRY_WARNING_DAYS);

    // Use individual count queries — avoids groupBy Prisma TS quirks
    const [
      vAvailable, vOnTrip, vInShop, vRetired,
      dAvailable, dOnTrip, dOffDuty, dSuspended,
      tDraft, tDispatched, tCompleted, tCancelled,
      mActive, mCompleted,
      revenueAgg, fuelCostAgg, expensesTotal,
      expiringLicenses, upcomingMaintenance,
    ] = await prisma.$transaction([
      prisma.vehicle.count({ where: { status: 'available' } }),
      prisma.vehicle.count({ where: { status: 'on_trip' } }),
      prisma.vehicle.count({ where: { status: 'in_shop' } }),
      prisma.vehicle.count({ where: { status: 'retired' } }),
      prisma.driver.count({ where: { status: 'available' } }),
      prisma.driver.count({ where: { status: 'on_trip' } }),
      prisma.driver.count({ where: { status: 'off_duty' } }),
      prisma.driver.count({ where: { status: 'suspended' } }),
      prisma.trip.count({ where: { status: 'draft' } }),
      prisma.trip.count({ where: { status: 'dispatched' } }),
      prisma.trip.count({ where: { status: 'completed' } }),
      prisma.trip.count({ where: { status: 'cancelled' } }),
      prisma.maintenanceRecord.count({ where: { status: 'active' } }),
      prisma.maintenanceRecord.count({ where: { status: 'completed' } }),
      prisma.vehicle.aggregate({ _sum: { revenue: true } }),
      prisma.fuelLog.aggregate({ _sum: { totalCost: true } }),
      prisma.expense.aggregate({ _sum: { totalCost: true } }),
      prisma.driver.count({ where: { licenseExpiryDate: { lte: warningDate }, status: { not: 'suspended' } } }),
      prisma.maintenanceRecord.count({ where: { status: 'active' } }),
    ]);

    const totalVehicles = vAvailable + vOnTrip + vInShop + vRetired;
    const activeVehicles = vAvailable + vOnTrip + vInShop;
    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    return {
      vehicles: {
        total: totalVehicles,
        available: vAvailable,
        onTrip: vOnTrip,
        inShop: vInShop,
        retired: vRetired,
      },
      drivers: {
        total: dAvailable + dOnTrip + dOffDuty + dSuspended,
        available: dAvailable,
        onTrip: dOnTrip,
        offDuty: dOffDuty,
        suspended: dSuspended,
      },
      trips: {
        total: tDraft + tDispatched + tCompleted + tCancelled,
        draft: tDraft,
        dispatched: tDispatched,
        completed: tCompleted,
        cancelled: tCancelled,
      },
      maintenance: {
        active: mActive,
        completed: mCompleted,
      },
      financials: {
        totalRevenue: revenueAgg._sum.revenue ?? 0,
        totalFuelCost: fuelCostAgg._sum.totalCost ?? 0,
        totalExpenses: expensesTotal._sum.totalCost ?? 0,
      },
      alerts: {
        expiringLicenses,
        activeMaintenance: upcomingMaintenance,
      },
      fleetUtilization,
    };
  }


  async getRecentActivity(limit = 10) {
    const [recentTrips, recentMaintenance] = await Promise.all([
      prisma.trip.findMany({
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, tripNumber: true, status: true, source: true,
          destination: true, updatedAt: true,
          vehicle: { select: { registrationNumber: true } },
          driver: { select: { name: true } },
        },
      }),
      prisma.maintenanceRecord.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, serviceType: true, status: true, updatedAt: true,
          vehicle: { select: { registrationNumber: true } },
        },
      }),
    ]);

    return {
      recentTrips,
      recentMaintenance,
    };
  }

  async getFleetHealth() {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + env.LICENSE_EXPIRY_WARNING_DAYS);

    const [expiringLicenses, activeMaintenance] = await Promise.all([
      prisma.driver.findMany({
        where: { licenseExpiryDate: { lte: warningDate } },
        select: { id: true, name: true, licenseExpiryDate: true, licenseNumber: true, status: true },
        orderBy: { licenseExpiryDate: 'asc' },
        take: 10,
      }),
      prisma.maintenanceRecord.findMany({
        where: { status: 'active' },
        select: {
          id: true, serviceType: true, scheduledDate: true, estimatedCost: true,
          vehicle: { select: { registrationNumber: true, name: true } },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10,
      }),
    ]);

    return { expiringLicenses, activeMaintenance };
  }
}

export const dashboardService = new DashboardService();
