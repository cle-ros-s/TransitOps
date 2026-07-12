"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelEfficiencyHandler = fuelEfficiencyHandler;
exports.fleetUtilizationHandler = fleetUtilizationHandler;
exports.operationalCostHandler = operationalCostHandler;
exports.vehicleROIHandler = vehicleROIHandler;
exports.monthlyRevenueHandler = monthlyRevenueHandler;
exports.exportCSVHandler = exportCSVHandler;
const analyticsService = __importStar(require("./analytics.service"));
const apiResponse_1 = require("../../utils/apiResponse");
async function fuelEfficiencyHandler(req, res) {
    const vehicleId = req.query.vehicleId;
    const data = await analyticsService.getFuelEfficiency(vehicleId);
    return (0, apiResponse_1.successResponse)(res, data);
}
async function fleetUtilizationHandler(_req, res) {
    const data = await analyticsService.getFleetUtilization();
    return (0, apiResponse_1.successResponse)(res, data);
}
async function operationalCostHandler(req, res) {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;
    const data = await analyticsService.getOperationalCost(fromDate, toDate);
    return (0, apiResponse_1.successResponse)(res, data);
}
async function vehicleROIHandler(_req, res) {
    const data = await analyticsService.getVehicleROI();
    return (0, apiResponse_1.successResponse)(res, data);
}
async function monthlyRevenueHandler(_req, res) {
    const data = await analyticsService.getMonthlyRevenue();
    return (0, apiResponse_1.successResponse)(res, data);
}
async function exportCSVHandler(_req, res) {
    const csv = await analyticsService.getExportData();
    const filename = `transitops-report-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
}
