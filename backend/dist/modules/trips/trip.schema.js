"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTripSchema = exports.completeTripSchema = exports.createTripSchema = void 0;
const zod_1 = require("zod");
exports.createTripSchema = zod_1.z.object({
    source: zod_1.z.string().min(1, 'Source is required'),
    destination: zod_1.z.string().min(1, 'Destination is required'),
    vehicleId: zod_1.z.string().uuid('Invalid vehicle ID'),
    driverId: zod_1.z.string().uuid('Invalid driver ID'),
    cargoWeightKg: zod_1.z.number().nonnegative('Cargo weight must be non-negative'),
    plannedDistanceKm: zod_1.z.number().positive('Planned distance must be positive'),
});
exports.completeTripSchema = zod_1.z.object({
    finalOdometer: zod_1.z.number().nonnegative(),
    fuelConsumedL: zod_1.z.number().nonnegative(),
    fuelCost: zod_1.z.number().nonnegative(),
});
exports.cancelTripSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Cancellation reason is required'),
});
