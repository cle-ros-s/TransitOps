"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fuelLog_controller_1 = require("./fuelLog.controller");
const authenticate_1 = require("../../middleware/authenticate");
const requirePermission_1 = require("../../middleware/requirePermission");
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
const createSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().uuid(),
    tripId: zod_1.z.string().uuid().optional(),
    date: zod_1.z.coerce.date(),
    liters: zod_1.z.number().positive(),
    cost: zod_1.z.number().nonnegative()
});
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.get('/', (0, requirePermission_1.requirePermission)('fuel_expenses'), fuelLog_controller_1.listFuelLogsHandler);
router.post('/', (0, requirePermission_1.requirePermission)('fuel_expenses'), (0, validate_1.validate)({ body: createSchema }), fuelLog_controller_1.createFuelLogHandler);
exports.default = router;
