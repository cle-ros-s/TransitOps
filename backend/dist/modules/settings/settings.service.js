"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = void 0;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getRbacMatrix = getRbacMatrix;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const zod_1 = require("zod");
const rbacMatrix_1 = require("../../config/rbacMatrix");
exports.updateSettingsSchema = zod_1.z.object({
    depotName: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().min(1).optional(),
    distanceUnit: zod_1.z.string().min(1).optional(),
    ratePerKm: zod_1.z.number().positive().optional(),
});
async function getSettings() {
    let settings = await prismaClient_1.default.settings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
        settings = await prismaClient_1.default.settings.create({ data: { id: 'singleton' } });
    }
    return settings;
}
async function updateSettings(data) {
    return prismaClient_1.default.settings.upsert({
        where: { id: 'singleton' },
        update: data,
        create: { id: 'singleton', ...data },
    });
}
function getRbacMatrix() {
    return rbacMatrix_1.rbacMatrix;
}
