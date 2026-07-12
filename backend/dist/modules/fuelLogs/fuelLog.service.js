"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFuelLogs = getAllFuelLogs;
exports.createFuelLog = createFuelLog;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
async function getAllFuelLogs(filters) {
    const where = {};
    if (filters.vehicleId)
        where.vehicleId = filters.vehicleId;
    if (filters.fromDate || filters.toDate) {
        where.date = {};
        if (filters.fromDate)
            where.date.gte = filters.fromDate;
        if (filters.toDate)
            where.date.lte = filters.toDate;
    }
    return prismaClient_1.default.fuelLog.findMany({ where, orderBy: { date: 'desc' } });
}
async function createFuelLog(data) {
    return prismaClient_1.default.fuelLog.create({ data });
}
