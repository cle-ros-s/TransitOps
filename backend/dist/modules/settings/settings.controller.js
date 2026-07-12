"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettingsHandler = getSettingsHandler;
exports.updateSettingsHandler = updateSettingsHandler;
exports.getRbacHandler = getRbacHandler;
const settings_service_1 = require("./settings.service");
const apiResponse_1 = require("../../utils/apiResponse");
async function getSettingsHandler(_req, res) {
    const settings = await (0, settings_service_1.getSettings)();
    return (0, apiResponse_1.successResponse)(res, settings);
}
async function updateSettingsHandler(req, res) {
    const parsed = settings_service_1.updateSettingsSchema.parse(req.body);
    const settings = await (0, settings_service_1.updateSettings)(parsed);
    return (0, apiResponse_1.successResponse)(res, settings);
}
async function getRbacHandler(_req, res) {
    return (0, apiResponse_1.successResponse)(res, (0, settings_service_1.getRbacMatrix)());
}
