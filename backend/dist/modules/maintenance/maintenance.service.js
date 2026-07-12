"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMaintenance = getAllMaintenance;
exports.getMaintenanceById = getMaintenanceById;
exports.createMaintenance = createMaintenance;
exports.closeMaintenance = closeMaintenance;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
async function getAllMaintenance(filters) {
    const where = {};
    if (filters.vehicleId)
        where.vehicleId = filters.vehicleId;
    if (filters.status)
        where.status = filters.status;
    const sortBy = filters.sortBy || 'date';
    const sortDir = filters.sortDir || 'desc';
    const [records, total] = await Promise.all([
        prismaClient_1.default.maintenanceRecord.findMany({ where, skip: filters.skip, take: filters.take, orderBy: { [sortBy]: sortDir }, include: { vehicle: true } }),
        prismaClient_1.default.maintenanceRecord.count({ where }),
    ]);
    return { records, total };
}
async function getMaintenanceById(id) {
    const record = await prismaClient_1.default.maintenanceRecord.findUnique({ where: { id }, include: { vehicle: true } });
    if (!record)
        throw new errors_1.NotFoundError(`Maintenance record ${id} not found`);
    return record;
}
async function createMaintenance(data) {
    return prismaClient_1.default.$transaction(async (tx) => {
        const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
        if (!vehicle)
            throw new errors_1.NotFoundError(`Vehicle ${data.vehicleId} not found`);
        if (vehicle.status === client_1.VehicleStatus.ON_TRIP)
            throw new errors_1.BusinessRuleError('Vehicle is currently ON_TRIP — cannot create maintenance record');
        if (vehicle.status === client_1.VehicleStatus.RETIRED)
            throw new errors_1.BusinessRuleError('Vehicle is RETIRED — cannot create maintenance record');
        const record = await tx.maintenanceRecord.create({ data: { ...data, status: client_1.MaintenanceStatus.ACTIVE } });
        await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: client_1.VehicleStatus.IN_SHOP } });
        return record;
    });
}
async function closeMaintenance(id) {
    return prismaClient_1.default.$transaction(async (tx) => {
        const record = await tx.maintenanceRecord.findUnique({ where: { id }, include: { vehicle: true } });
        if (!record)
            throw new errors_1.NotFoundError(`Maintenance record ${id} not found`);
        if (record.status === client_1.MaintenanceStatus.COMPLETED)
            throw new errors_1.BusinessRuleError('Maintenance record is already COMPLETED');
        const updated = await tx.maintenanceRecord.update({ where: { id }, data: { status: client_1.MaintenanceStatus.COMPLETED } });
        // Only restore AVAILABLE if vehicle is not already RETIRED
        if (record.vehicle.status !== client_1.VehicleStatus.RETIRED) {
            await tx.vehicle.update({ where: { id: record.vehicleId }, data: { status: client_1.VehicleStatus.AVAILABLE } });
        }
        return updated;
    });
}
