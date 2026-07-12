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
describe('Maintenance & Vehicle Business Rules', () => {
    let fleetManagerToken;
    let vehicleId;
    beforeAll(async () => {
        fleetManagerToken = (0, jwt_1.generateAccessToken)({ userId: '1', role: 'FLEET_MANAGER', email: 'fm@test.com' });
        const vehicle = await prismaClient_1.default.vehicle.create({
            data: {
                regNo: 'TEST-MAINT-1', name: 'Test Vehicle', type: 'Van', maxLoadCapacityKg: 1000,
                acquisitionCost: 10000, status: client_1.VehicleStatus.AVAILABLE
            }
        });
        vehicleId = vehicle.id;
    });
    afterAll(async () => {
        await prismaClient_1.default.expense.deleteMany();
        await prismaClient_1.default.maintenanceRecord.deleteMany();
        await prismaClient_1.default.fuelLog.deleteMany();
        await prismaClient_1.default.vehicle.deleteMany();
    });
    it('Creating Active maintenance sets vehicle to IN_SHOP', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/maintenance')
            .set('Authorization', `Bearer ${fleetManagerToken}`)
            .send({
            vehicleId, serviceType: 'Oil Change', cost: 200, date: new Date()
        });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(client_1.MaintenanceStatus.ACTIVE);
        const vehicle = await prismaClient_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        expect(vehicle?.status).toBe(client_1.VehicleStatus.IN_SHOP);
    });
    it('Closing maintenance restores to AVAILABLE', async () => {
        // Get the created record
        const records = await prismaClient_1.default.maintenanceRecord.findMany({ where: { vehicleId } });
        const recordId = records[0].id;
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/maintenance/${recordId}/close`)
            .set('Authorization', `Bearer ${fleetManagerToken}`);
        expect(res.status).toBe(200);
        const vehicle = await prismaClient_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        expect(vehicle?.status).toBe(client_1.VehicleStatus.AVAILABLE);
    });
    it('/api/vehicles/:id/operational-cost sums fuel + maintenance correctly', async () => {
        // Add some fuel logs
        await prismaClient_1.default.fuelLog.create({
            data: { vehicleId, date: new Date(), liters: 10, cost: 1000 }
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/vehicles/${vehicleId}/operational-cost`)
            .set('Authorization', `Bearer ${fleetManagerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.fuelTotal).toBe(1000);
        expect(res.body.data.maintenanceTotal).toBe(200); // from first test
        expect(res.body.data.total).toBe(1200);
    });
});
