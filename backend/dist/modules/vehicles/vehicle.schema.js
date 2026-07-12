"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createVehicleSchema = zod_1.z.object({
    regNo: zod_1.z.string().min(1, 'Registration number is required'),
    name: zod_1.z.string().min(1, 'Vehicle name is required'),
    type: zod_1.z.string().min(1, 'Vehicle type is required'),
    maxLoadCapacityKg: zod_1.z.number().positive('Capacity must be positive'),
    acquisitionCost: zod_1.z.number().nonnegative('Acquisition cost must be non-negative'),
    region: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.VehicleStatus).optional(),
});
exports.updateVehicleSchema = exports.createVehicleSchema.partial();
