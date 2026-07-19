import { prisma } from '../../config/prismaClient';

export class AnalyticsService {
  async getMonthlyTrends(months = 6) {
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [trips, fuelAgg, expenseAgg] = await Promise.all([
        prisma.trip.count({ where: { startDate: { gte: start, lt: end } } }),
        prisma.fuelLog.aggregate({ where: { date: { gte: start, lt: end } }, _sum: { totalCost: true, liters: true } }),
        prisma.expense.aggregate({ where: { date: { gte: start, lt: end } }, _sum: { totalCost: true } }),
      ]);

      const revenueAgg = await prisma.trip.aggregate({
        where: { status: 'completed', endDate: { gte: start, lt: end } },
        _sum: { revenue: true },
      });

      results.push({
        month: start.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
        trips,
        revenue: revenueAgg._sum.revenue ?? 0,
        fuel: fuelAgg._sum.totalCost ?? 0,
        fuelLiters: fuelAgg._sum.liters ?? 0,
        expenses: expenseAgg._sum.totalCost ?? 0,
      });
    }
    return results;
  }

  async getVehiclePerformance() {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        _count: { select: { trips: true } },
        trips: {
          where: { status: 'completed' },
          select: { revenue: true, plannedDistance: true, actualDistance: true },
        },
      },
    });

    return vehicles.map((v) => {
      const completedTrips = v.trips.length;
      const totalRevenue = v.trips.reduce((s, t) => s + t.revenue, 0);
      const totalDistance = v.trips.reduce((s, t) => s + (t.actualDistance ?? t.plannedDistance), 0);
      const roi = v.acquisitionCost > 0 ? ((v.revenue - 0) / v.acquisitionCost * 100) : 0;
      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        region: v.region,
        status: v.status,
        totalTrips: v._count.trips,
        completedTrips,
        totalRevenue,
        totalDistance,
        odometer: v.odometer,
        roi: parseFloat(roi.toFixed(2)),
      };
    });
  }

  async getDriverPerformance() {
    return prisma.driver.findMany({
      include: {
        _count: { select: { trips: true } },
        trips: {
          where: { status: 'completed' },
          select: { revenue: true, plannedDistance: true, actualDistance: true },
        },
      },
    }).then((drivers) => drivers.map((d) => ({
      driverId: d.id,
      name: d.name,
      licenseNumber: d.licenseNumber,
      status: d.status,
      safetyScore: d.safetyScore,
      tripCompletionRate: d.tripCompletionRate,
      totalTrips: d.totalTrips,
      completedTrips: d.trips.length,
      totalRevenue: d.trips.reduce((s, t) => s + t.revenue, 0),
      licenseExpiryDate: d.licenseExpiryDate,
    })));
  }

  async getTopCostlyVehicles(limit = 10) {
    const vehicles = await prisma.vehicle.findMany({ select: { id: true, registrationNumber: true, name: true, revenue: true } });

    const withCosts = await Promise.all(vehicles.map(async (v) => {
      const [fuelAgg, mainAgg, expAgg] = await Promise.all([
        prisma.fuelLog.aggregate({ where: { vehicleId: v.id }, _sum: { totalCost: true } }),
        prisma.maintenanceRecord.aggregate({ where: { vehicleId: v.id, status: 'completed' }, _sum: { actualCost: true } }),
        prisma.expense.aggregate({ where: { vehicleId: v.id }, _sum: { totalCost: true } }),
      ]);
      const totalCost = (fuelAgg._sum.totalCost ?? 0) + (mainAgg._sum.actualCost ?? 0) + (expAgg._sum.totalCost ?? 0);
      return { ...v, totalCost, profit: v.revenue - totalCost };
    }));

    return withCosts.sort((a, b) => b.totalCost - a.totalCost).slice(0, limit);
  }

  async getMaintenanceCosts() {
    return prisma.maintenanceRecord.groupBy({
      by: ['serviceType'],
      _sum: { estimatedCost: true, actualCost: true },
      _count: { id: true },
    });
  }

  async getMonthlyFuel(months = 6) {
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const agg = await prisma.fuelLog.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { totalCost: true, liters: true },
        _avg: { costPerLiter: true },
      });

      results.push({
        month: start.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
        totalCost: agg._sum.totalCost ?? 0,
        totalLiters: agg._sum.liters ?? 0,
        avgCostPerLiter: agg._avg.costPerLiter ?? 0,
      });
    }
    return results;
  }

  async getMonthlyExpenses(months = 6) {
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const agg = await prisma.expense.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { toll: true, otherExpenses: true, maintenanceCost: true, totalCost: true },
      });

      results.push({
        month: start.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
        toll: agg._sum.toll ?? 0,
        other: agg._sum.otherExpenses ?? 0,
        maintenance: agg._sum.maintenanceCost ?? 0,
        total: agg._sum.totalCost ?? 0,
      });
    }
    return results;
  }
}

export const analyticsService = new AnalyticsService();
