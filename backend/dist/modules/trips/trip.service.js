"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTrips = getAllTrips;
exports.getTripById = getTripById;
exports.createTrip = createTrip;
exports.dispatchTrip = dispatchTrip;
exports.completeTrip = completeTrip;
exports.cancelTrip = cancelTrip;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
async function validateVehicleForDispatch(vehicleId, db = prismaClient_1.default) {
    const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle)
        throw new errors_1.NotFoundError(`Vehicle ${vehicleId} not found`);
    if (vehicle.status === client_1.VehicleStatus.RETIRED)
        throw new errors_1.BusinessRuleError('Vehicle is RETIRED and cannot be assigned to a trip');
    if (vehicle.status === client_1.VehicleStatus.IN_SHOP)
        throw new errors_1.BusinessRuleError('Vehicle is IN_SHOP and cannot be assigned to a trip');
    if (vehicle.status === client_1.VehicleStatus.ON_TRIP)
        throw new errors_1.ConflictError('Vehicle is already ON_TRIP — cannot double-assign');
    return vehicle;
}
async function validateDriverForDispatch(driverId, db = prismaClient_1.default) {
    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver)
        throw new errors_1.NotFoundError(`Driver ${driverId} not found`);
    if (driver.status === client_1.DriverStatus.SUSPENDED)
        throw new errors_1.BusinessRuleError('Driver is SUSPENDED and cannot be assigned to a trip');
    if (driver.status === client_1.DriverStatus.ON_TRIP)
        throw new errors_1.ConflictError('Driver is already ON_TRIP — cannot double-assign');
    if (driver.licenseExpiry <= new Date())
        throw new errors_1.BusinessRuleError('Driver license is expired — dispatch blocked');
    return driver;
}
async function getAllTrips(filters) {
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.vehicleId)
        where.vehicleId = filters.vehicleId;
    if (filters.driverId)
        where.driverId = filters.driverId;
    if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate)
            where.createdAt.gte = filters.fromDate;
        if (filters.toDate)
            where.createdAt.lte = filters.toDate;
    }
    const [trips, total] = await Promise.all([
        prismaClient_1.default.trip.findMany({
            where, skip: filters.skip, take: filters.take,
            orderBy: { [filters.sortBy || 'createdAt']: filters.sortDir || 'desc' },
            include: { vehicle: true, driver: true },
        }),
        prismaClient_1.default.trip.count({ where }),
    ]);
    return { trips, total };
}
async function getTripById(id) {
    const trip = await prismaClient_1.default.trip.findUnique({
        where: { id },
        include: { vehicle: true, driver: true, fuelLogs: true, expenses: true },
    });
    if (!trip)
        throw new errors_1.NotFoundError(`Trip ${id} not found`);
    return trip;
}
async function createTrip(data) {
    const vehicle = await validateVehicleForDispatch(data.vehicleId);
    await validateDriverForDispatch(data.driverId);
    if (data.cargoWeightKg > vehicle.maxLoadCapacityKg) {
        const excess = (data.cargoWeightKg - vehicle.maxLoadCapacityKg).toFixed(2);
        throw new errors_1.BusinessRuleError(`Capacity exceeded by ${excess} kg — dispatch blocked`);
    }
    return prismaClient_1.default.trip.create({
        data: { ...data, status: client_1.TripStatus.DRAFT },
        include: { vehicle: true, driver: true },
    });
}
async function dispatchTrip(id) {
    const trip = await getTripById(id);
    if (trip.status !== client_1.TripStatus.DRAFT)
        throw new errors_1.ConflictError(`Cannot dispatch trip in status '${trip.status}'. Only DRAFT trips can be dispatched.`);
    return prismaClient_1.default.$transaction(async (tx) => {
        const vehicle = await validateVehicleForDispatch(trip.vehicleId, tx);
        await validateDriverForDispatch(trip.driverId, tx);
        if (trip.cargoWeightKg > vehicle.maxLoadCapacityKg) {
            const excess = (trip.cargoWeightKg - vehicle.maxLoadCapacityKg).toFixed(2);
            throw new errors_1.BusinessRuleError(`Capacity exceeded by ${excess} kg — dispatch blocked`);
        }
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: client_1.VehicleStatus.ON_TRIP } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: client_1.DriverStatus.ON_TRIP } });
        return tx.trip.update({
            where: { id },
            data: { status: client_1.TripStatus.DISPATCHED, dispatchedAt: new Date() },
            include: { vehicle: true, driver: true },
        });
    });
}
async function completeTrip(id, data) {
    const trip = await getTripById(id);
    if (trip.status !== client_1.TripStatus.DISPATCHED)
        throw new errors_1.ConflictError(`Cannot complete trip in status '${trip.status}'. Only DISPATCHED trips can be completed.`);
    return prismaClient_1.default.$transaction(async (tx) => {
        const completedTrip = await tx.trip.update({
            where: { id },
            data: {
                status: client_1.TripStatus.COMPLETED, completedAt: new Date(),
                finalOdometer: data.finalOdometer, fuelConsumedL: data.fuelConsumedL,
            },
        });
        await tx.vehicle.update({
            where: { id: trip.vehicleId },
            data: { odometer: data.finalOdometer, status: client_1.VehicleStatus.AVAILABLE },
        });
        // Update driver completion percentage
        const [totalTrips, completedCount] = await Promise.all([
            tx.trip.count({ where: { driverId: trip.driverId, status: { in: [client_1.TripStatus.COMPLETED, client_1.TripStatus.CANCELLED] } } }),
            tx.trip.count({ where: { driverId: trip.driverId, status: client_1.TripStatus.COMPLETED } }),
        ]);
        const newPct = totalTrips > 0 ? (completedCount / totalTrips) * 100 : 0;
        await tx.driver.update({
            where: { id: trip.driverId },
            data: { status: client_1.DriverStatus.AVAILABLE, tripCompletionPct: newPct },
        });
        // Auto-create fuel log
        await tx.fuelLog.create({
            data: { vehicleId: trip.vehicleId, tripId: id, date: new Date(), liters: data.fuelConsumedL, cost: data.fuelCost },
        });
        return completedTrip;
    });
}
async function cancelTrip(id, data) {
    const trip = await getTripById(id);
    if (trip.status !== client_1.TripStatus.DRAFT && trip.status !== client_1.TripStatus.DISPATCHED)
        throw new errors_1.ConflictError(`Cannot cancel trip in status '${trip.status}'. Only DRAFT or DISPATCHED trips can be cancelled.`);
    return prismaClient_1.default.$transaction(async (tx) => {
        const updatedTrip = await tx.trip.update({
            where: { id },
            data: { status: client_1.TripStatus.CANCELLED, cancellationReason: data.reason },
        });
        if (trip.status === client_1.TripStatus.DISPATCHED) {
            await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: client_1.VehicleStatus.AVAILABLE } });
            await tx.driver.update({ where: { id: trip.driverId }, data: { status: client_1.DriverStatus.AVAILABLE } });
        }
        return updatedTrip;
    });
}
