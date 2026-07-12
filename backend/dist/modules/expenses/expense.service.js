"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpenses = getAllExpenses;
exports.createExpense = createExpense;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
async function getAllExpenses(filters) {
    const where = {};
    if (filters.vehicleId)
        where.vehicleId = filters.vehicleId;
    if (filters.tripId)
        where.tripId = filters.tripId;
    return prismaClient_1.default.expense.findMany({ where });
}
async function createExpense(data) {
    return prismaClient_1.default.expense.create({ data });
}
