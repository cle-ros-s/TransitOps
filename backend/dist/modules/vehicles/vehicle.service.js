"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVehicles = getAllVehicles;
exports.getVehicleById = getVehicleById;
exports.getAvailableVehicles = getAvailableVehicles;
exports.createVehicle = createVehicle;
exports.updateVehicle = updateVehicle;
exports.deleteVehicle = deleteVehicle;
exports.getOperationalCost = getOperationalCost;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const SYSTEM_MANAGED_STATUSES = [client_1.VehicleStatus.ON_TRIP, client_1.VehicleStatus.IN_SHOP];
async function getAllVehicles(filters) {
    const where = {};
    if (filters.type)
        where.type = filters.type;
    if (filters.status)
        where.status = filters.status;
    if (filters.region)
        where.region = filters.region;
    if (filters.search) {
        where.OR = [
            { regNo: { contains: filters.search, mode: 'insensitive' } },
            { name: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [vehicles, total] = await Promise.all([
        prismaClient_1.default.vehicle.findMany({
            where, skip: filters.skip, take: filters.take,
            orderBy: { [filters.sortBy || 'createdAt']: filters.sortDir || 'desc' },
        }),
        prismaClient_1.default.vehicle.count({ where }),
    ]);
    return { vehicles, total };
}
async function getVehicleById(id) {
    const vehicle = await prismaClient_1.default.vehicle.findUnique({ where: { id } });
    if (!vehicle)
        throw new errors_1.NotFoundError(`Vehicle ${id} not found`);
    return vehicle;
}
async function getAvailableVehicles() {
    return prismaClient_1.default.vehicle.findMany({ where: { status: client_1.VehicleStatus.AVAILABLE } });
}
async function createVehicle(data) {
    // Block system-managed statuses
    if (data.status && SYSTEM_MANAGED_STATUSES.includes(data.status)) {
        throw new errors_1.BusinessRuleError(`Cannot create vehicle with status '${data.status}' — system-managed`);
    }
    try {
        return await prismaClient_1.default.vehicle.create({ data: { ...data, status: data.status || client_1.VehicleStatus.AVAILABLE } });
    }
    catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('regNo')) {
            throw new errors_1.ConflictError(`Vehicle with regNo '${data.regNo}' already exists`);
        }
        throw err;
    }
}
async function updateVehicle(id, data) {
    await getVehicleById(id);
    if (data.status && SYSTEM_MANAGED_STATUSES.includes(data.status)) {
        throw new errors_1.BusinessRuleError(`Cannot set vehicle status to '${data.status}' — system-managed`);
    }
    try {
        return await prismaClient_1.default.vehicle.update({ where: { id }, data });
    }
    catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('regNo')) {
            throw new errors_1.ConflictError(`Vehicle with regNo '${data.regNo}' already exists`);
        }
        throw err;
    }
}
async function deleteVehicle(id) {
    await getVehicleById(id);
    return prismaClient_1.default.vehicle.update({ where: { id }, data: { status: client_1.VehicleStatus.RETIRED } });
}
async function getOperationalCost(vehicleId) {
    await getVehicleById(vehicleId);
    const [fuelAgg, maintAgg, expAgg] = await Promise.all([
        prismaClient_1.default.fuelLog.aggregate({ _sum: { cost: true }, where: { vehicleId } }),
        prismaClient_1.default.maintenanceRecord.aggregate({ _sum: { cost: true }, where: { vehicleId } }),
        prismaClient_1.default.expense.aggregate({ _sum: { toll: true, other: true }, where: { vehicleId } }),
    ]);
    const fuelTotal = fuelAgg._sum.cost || 0;
    const maintenanceTotal = maintAgg._sum.cost || 0;
    const tollTotal = expAgg._sum.toll || 0;
    const otherTotal = expAgg._sum.other || 0;
    return { fuelTotal, maintenanceTotal, tollTotal, otherTotal, total: fuelTotal + maintenanceTotal + tollTotal + otherTotal };
}
