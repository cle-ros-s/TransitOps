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
exports.listTripsHandler = listTripsHandler;
exports.getTripHandler = getTripHandler;
exports.createTripHandler = createTripHandler;
exports.dispatchTripHandler = dispatchTripHandler;
exports.completeTripHandler = completeTripHandler;
exports.cancelTripHandler = cancelTripHandler;
const tripService = __importStar(require("./trip.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const pagination_1 = require("../../utils/pagination");
async function listTripsHandler(req, res) {
    const { skip, take, sortBy, sortDir } = (0, pagination_1.getPaginationParams)(req);
    const status = req.query.status;
    const vehicleId = req.query.vehicleId;
    const driverId = req.query.driverId;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;
    const { trips, total } = await tripService.getAllTrips({ status, vehicleId, driverId, fromDate, toDate, skip, take, sortBy, sortDir });
    return (0, apiResponse_1.successResponse)(res, { trips, pagination: { total, page: Math.floor(skip / take) + 1, pageSize: take } });
}
async function getTripHandler(req, res) {
    const trip = await tripService.getTripById(req.params.id);
    return (0, apiResponse_1.successResponse)(res, trip);
}
async function createTripHandler(req, res) {
    const trip = await tripService.createTrip(req.body);
    return (0, apiResponse_1.successResponse)(res, trip, 201);
}
async function dispatchTripHandler(req, res) {
    const trip = await tripService.dispatchTrip(req.params.id);
    return (0, apiResponse_1.successResponse)(res, trip);
}
async function completeTripHandler(req, res) {
    const trip = await tripService.completeTrip(req.params.id, req.body);
    return (0, apiResponse_1.successResponse)(res, trip);
}
async function cancelTripHandler(req, res) {
    const trip = await tripService.cancelTrip(req.params.id, req.body);
    return (0, apiResponse_1.successResponse)(res, trip);
}
