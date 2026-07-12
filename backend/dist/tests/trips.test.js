"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prismaClient_1 = __importDefault(require("../src/config/prismaClient"));
const client_1 = require("@prisma/client");
const jwt_1 = require("../src/utils/jwt");
describe('Trips Lifecycle and Business Rules Endpoints', () => {
    let dispatcherToken;
    let vehicleId;
    let driverId;
    let tripId;
    beforeAll(async () => {
        dispatcherToken = (0, jwt_1.generateAccessToken)({ userId: '2', role: 'DISPATCHER', email: 'disp@test.com' });
        const vehicle = await prismaClient_1.default.vehicle.create({
            data: {
                regNo: 'TEST-V1', name: 'Test Vehicle', type: 'Van', maxLoadCapacityKg: 1000,
                acquisitionCost: 10000, status: client_1.VehicleStatus.AVAILABLE
            }
        });
        vehicleId = vehicle.id;
        const driver = await prismaClient_1.default.driver.create({
            data: {
                name: 'Test Driver', licenseNumber: 'TEST-LIC-1', licenseCategory: 'LMV',
                licenseExpiry: new Date(Date.now() + 86400000 * 365), contact: '1234',
                status: client_1.DriverStatus.AVAILABLE
            }
        });
        driverId = driver.id;
    });
    afterAll(async () => {
        await prismaClient_1.default.fuelLog.deleteMany();
        await prismaClient_1.default.trip.deleteMany();
        await prismaClient_1.default.driver.deleteMany();
        await prismaClient_1.default.vehicle.deleteMany();
    });
    it('Dispatcher should be able to create a Draft trip', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/trips')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
            source: 'A', destination: 'B', vehicleId, driverId,
            cargoWeightKg: 500, plannedDistanceKm: 100
        });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(client_1.TripStatus.DRAFT);
        tripId = res.body.data.id;
    });
    it('Should block trip creation if cargo > capacity', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/trips')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
            source: 'A', destination: 'B', vehicleId, driverId,
            cargoWeightKg: 1500, // vehicle capacity is 1000
            plannedDistanceKm: 100
        });
        expect(res.status).toBe(422);
        expect(res.body.error.message).toMatch(/Capacity exceeded by/);
    });
    it('Dispatching trip sets vehicle & driver to ON_TRIP', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/trips/${tripId}/dispatch`)
            .set('Authorization', `Bearer ${dispatcherToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(client_1.TripStatus.DISPATCHED);
        const vehicle = await prismaClient_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        const driver = await prismaClient_1.default.driver.findUnique({ where: { id: driverId } });
        expect(vehicle?.status).toBe(client_1.VehicleStatus.ON_TRIP);
        expect(driver?.status).toBe(client_1.DriverStatus.ON_TRIP);
    });
    it('Should block a second dispatch attempt using the same vehicle (already ON_TRIP)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/trips')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
            source: 'X', destination: 'Y', vehicleId, driverId,
            cargoWeightKg: 100, plannedDistanceKm: 50
        });
        expect(res.status).toBe(409); // ConflictError for double-assignment
        expect(res.body.error.message).toMatch(/already ON_TRIP/);
    });
    it('Completing trip sets them back to AVAILABLE and updates odometer', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/trips/${tripId}/complete`)
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
            finalOdometer: 150,
            fuelConsumedL: 10,
            fuelCost: 1000
        });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(client_1.TripStatus.COMPLETED);
        const vehicle = await prismaClient_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        const driver = await prismaClient_1.default.driver.findUnique({ where: { id: driverId } });
        expect(vehicle?.status).toBe(client_1.VehicleStatus.AVAILABLE);
        expect(vehicle?.odometer).toBe(150);
        expect(driver?.status).toBe(client_1.DriverStatus.AVAILABLE);
        // Verify fuel log created
        const fuelLogs = await prismaClient_1.default.fuelLog.findMany({ where: { tripId } });
        expect(fuelLogs.length).toBe(1);
        expect(fuelLogs[0].liters).toBe(10);
    });
});
