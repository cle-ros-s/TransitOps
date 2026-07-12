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
exports.listMaintenanceHandler = listMaintenanceHandler;
exports.getMaintenanceHandler = getMaintenanceHandler;
exports.createMaintenanceHandler = createMaintenanceHandler;
exports.closeMaintenanceHandler = closeMaintenanceHandler;
const maintenanceService = __importStar(require("./maintenance.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const pagination_1 = require("../../utils/pagination");
async function listMaintenanceHandler(req, res) {
    const { skip, take, sortBy, sortDir } = (0, pagination_1.getPaginationParams)(req, 'date', 'desc');
    const vehicleId = req.query.vehicleId;
    const status = req.query.status;
    const { records, total } = await maintenanceService.getAllMaintenance({ vehicleId, status, skip, take, sortBy, sortDir });
    return (0, apiResponse_1.successResponse)(res, { records, pagination: { total, page: Math.floor(skip / take) + 1, pageSize: take } });
}
async function getMaintenanceHandler(req, res) {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    return (0, apiResponse_1.successResponse)(res, record);
}
async function createMaintenanceHandler(req, res) {
    const record = await maintenanceService.createMaintenance(req.body);
    return (0, apiResponse_1.successResponse)(res, record, 201);
}
async function closeMaintenanceHandler(req, res) {
    const record = await maintenanceService.closeMaintenance(req.params.id);
    return (0, apiResponse_1.successResponse)(res, record);
}
