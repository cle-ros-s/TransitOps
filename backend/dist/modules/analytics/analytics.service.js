"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFuelEfficiency = getFuelEfficiency;
exports.getFleetUtilization = getFleetUtilization;
exports.getOperationalCost = getOperationalCost;
exports.getVehicleROI = getVehicleROI;
exports.getMonthlyRevenue = getMonthlyRevenue;
exports.getExportData = getExportData;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const client_1 = require("@prisma/client");
const env_1 = require("../../config/env");
async function getFuelEfficiency(vehicleId) {
    const trips = await prismaClient_1.default.trip.findMany({
        where: {
            status: client_1.TripStatus.COMPLETED,
            ...(vehicleId && { vehicleId })
        },
        select: { plannedDistanceKm: true, fuelConsumedL: true }
    });
    const totalDistance = trips.reduce((sum, t) => sum + (t.plannedDistanceKm || 0), 0);
    const totalFuel = trips.reduce((sum, t) => sum + (t.fuelConsumedL || 0), 0);
    return {
        totalDistanceKm: totalDistance,
        totalFuelLiters: totalFuel,
        efficiencyKmPerL: totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0
    };
}
async function getFleetUtilization() {
    const [activeVehicles, availableVehicles, vehiclesInShop] = await Promise.all([
        prismaClient_1.default.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
        prismaClient_1.default.vehicle.count({ where: { status: 'AVAILABLE' } }),
        prismaClient_1.default.vehicle.count({ where: { status: 'IN_SHOP' } })
    ]);
    const utilized = activeVehicles - availableVehicles - vehiclesInShop;
    const utilizationPct = activeVehicles > 0 ? (utilized / activeVehicles) * 100 : 0;
    return { activeVehicles, utilizedVehicles: utilized, utilizationPct: parseFloat(utilizationPct.toFixed(2)) };
}
async function getOperationalCost(fromDate, toDate) {
    const dateFilter = fromDate || toDate ? {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate })
    } : undefined;
    const [fuelAgg, maintAgg] = await Promise.all([
        prismaClient_1.default.fuelLog.aggregate({
            _sum: { cost: true },
            ...(dateFilter && { where: { date: dateFilter } })
        }),
        prismaClient_1.default.maintenanceRecord.aggregate({
            _sum: { cost: true },
            ...(dateFilter && { where: { date: dateFilter } })
        })
    ]);
    const fuelCost = fuelAgg._sum.cost || 0;
    const maintenanceCost = maintAgg._sum.cost || 0;
    return { fuelCost, maintenanceCost, totalCost: fuelCost + maintenanceCost };
}
async function getVehicleROI() {
    const vehicles = await prismaClient_1.default.vehicle.findMany({
        include: {
            fuelLogs: { select: { cost: true } },
            maintenanceLogs: { select: { cost: true } }
        }
    });
    const rois = vehicles.map(v => {
        const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
        const maintCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
        const totalCost = fuelCost + maintCost;
        const roi = v.acquisitionCost > 0 ? ((v.revenue - totalCost) / v.acquisitionCost) * 100 : 0;
        return {
            vehicleId: v.id,
            regNo: v.regNo,
            name: v.name,
            acquisitionCost: v.acquisitionCost,
            revenue: v.revenue,
            totalOperationalCost: totalCost,
            roiPct: parseFloat(roi.toFixed(2))
        };
    });
    return rois.sort((a, b) => b.roiPct - a.roiPct);
}
async function getMonthlyRevenue() {
    const trips = await prismaClient_1.default.trip.findMany({
        where: { status: client_1.TripStatus.COMPLETED },
        select: { completedAt: true, plannedDistanceKm: true }
    });
    const ratePerKm = env_1.env.DEFAULT_RATE_PER_KM;
    const monthlyData = {};
    for (const trip of trips) {
        if (!trip.completedAt)
            continue;
        const month = trip.completedAt.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month])
            monthlyData[month] = 0;
        monthlyData[month] += trip.plannedDistanceKm * ratePerKm;
    }
    return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue }));
}
async function getExportData() {
    const [vehicles, roiData] = await Promise.all([
        prismaClient_1.default.vehicle.findMany(),
        getVehicleROI()
    ]);
    const header = 'RegNo,Name,Type,Status,AcquisitionCost,Revenue,OperationalCost,ROI_Pct\n';
    const rows = roiData.map(v => `${v.regNo},${v.name},${vehicles.find(x => x.id === v.vehicleId)?.type || ''},${vehicles.find(x => x.id === v.vehicleId)?.status || ''},${v.acquisitionCost},${v.revenue},${v.totalOperationalCost},${v.roiPct}`).join('\n');
    return header + rows;
}
