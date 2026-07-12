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
exports.listDriversHandler = listDriversHandler;
exports.getDriverHandler = getDriverHandler;
exports.createDriverHandler = createDriverHandler;
exports.updateDriverHandler = updateDriverHandler;
exports.patchDriverStatusHandler = patchDriverStatusHandler;
exports.listAvailableDriversHandler = listAvailableDriversHandler;
const driverService = __importStar(require("./driver.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const pagination_1 = require("../../utils/pagination");
async function listDriversHandler(req, res) {
    const { skip, take, sortBy, sortDir } = (0, pagination_1.getPaginationParams)(req);
    const status = req.query.status;
    const licenseCategory = req.query.licenseCategory;
    const search = req.query.search;
    const { drivers, total } = await driverService.getAllDrivers({ status, licenseCategory, search, skip, take, sortBy, sortDir });
    return (0, apiResponse_1.successResponse)(res, { drivers, pagination: { total, page: Math.floor(skip / take) + 1, pageSize: take } });
}
async function getDriverHandler(req, res) {
    const driver = await driverService.getDriverById(req.params.id);
    return (0, apiResponse_1.successResponse)(res, driver);
}
async function createDriverHandler(req, res) {
    const driver = await driverService.createDriver(req.body);
    return (0, apiResponse_1.successResponse)(res, driver, 201);
}
async function updateDriverHandler(req, res) {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    return (0, apiResponse_1.successResponse)(res, driver);
}
async function patchDriverStatusHandler(req, res) {
    const driver = await driverService.patchDriverStatus(req.params.id, req.body.status);
    return (0, apiResponse_1.successResponse)(res, driver);
}
async function listAvailableDriversHandler(_req, res) {
    const drivers = await driverService.getAvailableDrivers();
    return (0, apiResponse_1.successResponse)(res, drivers);
}
