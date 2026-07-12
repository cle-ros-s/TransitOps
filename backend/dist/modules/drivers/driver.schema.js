"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchDriverStatusSchema = exports.updateDriverSchema = exports.createDriverSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createDriverSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    licenseNumber: zod_1.z.string().min(1, 'License number is required'),
    licenseCategory: zod_1.z.string().min(1, 'License category is required'),
    licenseExpiry: zod_1.z.coerce.date(),
    contact: zod_1.z.string().min(1, 'Contact is required'),
});
exports.updateDriverSchema = exports.createDriverSchema.partial();
exports.patchDriverStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.DriverStatus),
});
