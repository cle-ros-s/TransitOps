"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const jwt_1 = require("../src/utils/jwt");
describe('Analytics Endpoints', () => {
    let analystToken;
    beforeAll(() => {
        analystToken = (0, jwt_1.generateAccessToken)({ userId: '2', role: 'FINANCIAL_ANALYST', email: 'fin@test.com' });
    });
    it('/api/analytics/export.csv returns a valid CSV with correct headers', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/analytics/export.csv')
            .set('Authorization', `Bearer ${analystToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
        expect(res.headers['content-disposition']).toMatch(/attachment; filename="transitops-report-/);
        // Check CSV structure
        const lines = res.text.split('\n');
        expect(lines[0]).toBe('RegNo,Name,Type,Status,AcquisitionCost,Revenue,OperationalCost,ROI_Pct');
    });
});
