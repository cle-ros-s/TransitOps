"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaintenanceSchema = void 0;
const zod_1 = require("zod");
exports.createMaintenanceSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().uuid('Invalid vehicle ID'),
    serviceType: zod_1.z.string().min(1, 'Service type is required'),
    cost: zod_1.z.number().nonnegative('Cost must be non-negative'),
    date: zod_1.z.coerce.date(),
});
