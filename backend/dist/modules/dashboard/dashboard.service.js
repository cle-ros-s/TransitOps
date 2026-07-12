"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardKPIs = getDashboardKPIs;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const client_1 = require("@prisma/client");
async function getDashboardKPIs(filters) {
    const vehicleWhere = {
        ...(filters.type && { type: filters.type }),
        ...(filters.region && { region: filters.region }),
    };
    const [activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, recentTrips, vehicleStatusGroups] = await Promise.all([
        prismaClient_1.default.vehicle.count({ where: { ...vehicleWhere, status: { not: client_1.VehicleStatus.RETIRED } } }),
        prismaClient_1.default.vehicle.count({ where: { ...vehicleWhere, status: client_1.VehicleStatus.AVAILABLE } }),
        prismaClient_1.default.vehicle.count({ where: { ...vehicleWhere, status: client_1.VehicleStatus.IN_SHOP } }),
        prismaClient_1.default.trip.count({ where: { status: client_1.TripStatus.DISPATCHED } }),
        prismaClient_1.default.trip.count({ where: { status: client_1.TripStatus.DRAFT } }),
        prismaClient_1.default.driver.count({ where: { status: client_1.DriverStatus.ON_TRIP } }),
        prismaClient_1.default.trip.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { vehicle: true, driver: true }
        }),
        prismaClient_1.default.vehicle.groupBy({
            by: ['status'],
            _count: true,
            where: vehicleWhere
        })
    ]);
    const fleetUtilizationPct = activeVehicles > 0 ? ((activeVehicles - availableVehicles - vehiclesInMaintenance) / activeVehicles) * 100 : 0;
    const vehicleStatusBreakdown = vehicleStatusGroups.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
    }, {});
    return {
        kpis: {
            activeVehicles,
            availableVehicles,
            vehiclesInMaintenance,
            activeTrips,
            pendingTrips,
            driversOnDuty,
            fleetUtilizationPct: parseFloat(fleetUtilizationPct.toFixed(2))
        },
        recentTrips,
        vehicleStatusBreakdown
    };
}
