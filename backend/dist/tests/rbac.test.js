"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const jwt_1 = require("../src/utils/jwt");
describe('RBAC Middleware', () => {
    let dispatcherToken;
    let analystToken;
    beforeAll(() => {
        dispatcherToken = (0, jwt_1.generateAccessToken)({ userId: '1', role: 'DISPATCHER', email: 'disp@test.com' });
        analystToken = (0, jwt_1.generateAccessToken)({ userId: '2', role: 'FINANCIAL_ANALYST', email: 'fin@test.com' });
    });
    it('Dispatcher should be blocked from Maintenance routes', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/maintenance')
            .set('Authorization', `Bearer ${dispatcherToken}`);
        expect(res.status).toBe(403);
    });
    it('Dispatcher should be able to view Vehicles', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/vehicles')
            .set('Authorization', `Bearer ${dispatcherToken}`);
        expect(res.status).toBe(200);
    });
    it('Dispatcher should be blocked from creating Vehicles', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/vehicles')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({ regNo: 'TEST', name: 'TEST', type: 'Van', maxLoadCapacityKg: 100, acquisitionCost: 100 });
        expect(res.status).toBe(403);
    });
    it('Analyst should be able to view Analytics', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/analytics/fleet-utilization')
            .set('Authorization', `Bearer ${analystToken}`);
        expect(res.status).toBe(200);
    });
    it('Analyst should be blocked from Trips', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/trips')
            .set('Authorization', `Bearer ${analystToken}`);
        expect(res.status).toBe(403);
    });
});
