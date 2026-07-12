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
exports.listVehiclesHandler = listVehiclesHandler;
exports.getVehicleHandler = getVehicleHandler;
exports.createVehicleHandler = createVehicleHandler;
exports.updateVehicleHandler = updateVehicleHandler;
exports.deleteVehicleHandler = deleteVehicleHandler;
exports.listAvailableVehiclesHandler = listAvailableVehiclesHandler;
exports.operationalCostHandler = operationalCostHandler;
const vehicleService = __importStar(require("./vehicle.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const pagination_1 = require("../../utils/pagination");
async function listVehiclesHandler(req, res) {
    const { skip, take, sortBy, sortDir } = (0, pagination_1.getPaginationParams)(req);
    const type = req.query.type;
    const status = req.query.status;
    const region = req.query.region;
    const search = req.query.search;
    const { vehicles, total } = await vehicleService.getAllVehicles({ type, status, region, search, skip, take, sortBy, sortDir });
    return (0, apiResponse_1.successResponse)(res, { vehicles, pagination: { total, page: Math.floor(skip / take) + 1, pageSize: take } });
}
async function getVehicleHandler(req, res) {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    return (0, apiResponse_1.successResponse)(res, vehicle);
}
async function createVehicleHandler(req, res) {
    const vehicle = await vehicleService.createVehicle(req.body);
    return (0, apiResponse_1.successResponse)(res, vehicle, 201);
}
async function updateVehicleHandler(req, res) {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    return (0, apiResponse_1.successResponse)(res, vehicle);
}
async function deleteVehicleHandler(req, res) {
    const vehicle = await vehicleService.deleteVehicle(req.params.id);
    return (0, apiResponse_1.successResponse)(res, vehicle);
}
async function listAvailableVehiclesHandler(_req, res) {
    const vehicles = await vehicleService.getAvailableVehicles();
    return (0, apiResponse_1.successResponse)(res, vehicles);
}
async function operationalCostHandler(req, res) {
    const data = await vehicleService.getOperationalCost(req.params.id);
    return (0, apiResponse_1.successResponse)(res, data);
}
