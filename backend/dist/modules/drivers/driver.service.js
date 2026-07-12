"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDrivers = getAllDrivers;
exports.getDriverById = getDriverById;
exports.getAvailableDrivers = getAvailableDrivers;
exports.createDriver = createDriver;
exports.updateDriver = updateDriver;
exports.patchDriverStatus = patchDriverStatus;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
async function getAllDrivers(filters) {
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.licenseCategory)
        where.licenseCategory = filters.licenseCategory;
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [drivers, total] = await Promise.all([
        prismaClient_1.default.driver.findMany({
            where, skip: filters.skip, take: filters.take,
            orderBy: { [filters.sortBy || 'createdAt']: filters.sortDir || 'desc' },
        }),
        prismaClient_1.default.driver.count({ where }),
    ]);
    return { drivers, total };
}
async function getDriverById(id) {
    const driver = await prismaClient_1.default.driver.findUnique({ where: { id } });
    if (!driver)
        throw new errors_1.NotFoundError(`Driver ${id} not found`);
    return driver;
}
async function getAvailableDrivers() {
    return prismaClient_1.default.driver.findMany({
        where: { status: client_1.DriverStatus.AVAILABLE, licenseExpiry: { gt: new Date() } },
    });
}
async function createDriver(data) {
    try {
        return await prismaClient_1.default.driver.create({ data });
    }
    catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('licenseNumber')) {
            throw new errors_1.ConflictError(`Driver with license '${data.licenseNumber}' already exists`);
        }
        throw err;
    }
}
async function updateDriver(id, data) {
    await getDriverById(id);
    try {
        return await prismaClient_1.default.driver.update({ where: { id }, data });
    }
    catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('licenseNumber')) {
            throw new errors_1.ConflictError(`Driver with license '${data.licenseNumber}' already exists`);
        }
        throw err;
    }
}
async function patchDriverStatus(id, status) {
    await getDriverById(id);
    if (status === client_1.DriverStatus.ON_TRIP) {
        throw new errors_1.BusinessRuleError("Cannot set driver status to 'ON_TRIP' manually — system-managed");
    }
    return prismaClient_1.default.driver.update({ where: { id }, data: { status } });
}
