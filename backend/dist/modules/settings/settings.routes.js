"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const authenticate_1 = require("../../middleware/authenticate");
const requirePermission_1 = require("../../middleware/requirePermission");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.get('/', (0, requirePermission_1.requirePermission)('settings'), settings_controller_1.getSettingsHandler);
router.put('/', (0, requirePermission_1.requirePermission)('settings'), settings_controller_1.updateSettingsHandler);
router.get('/rbac', settings_controller_1.getRbacHandler); // Optional: anyone authenticated might need to see what they can do, or restrict to settings.
exports.default = router;
