"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prismaClient_1 = __importDefault(require("../src/config/prismaClient"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
describe('Auth Endpoints', () => {
    let userId;
    let accessToken;
    beforeAll(async () => {
        const passwordHash = await bcryptjs_1.default.hash('password123', 10);
        const user = await prismaClient_1.default.user.create({
            data: {
                name: 'Test Fleet Manager',
                email: 'test@transitops.in',
                passwordHash,
                role: client_1.Role.FLEET_MANAGER,
            },
        });
        userId = user.id;
    });
    afterAll(async () => {
        await prismaClient_1.default.user.deleteMany({});
    });
    it('should login successfully with correct credentials', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'test@transitops.in',
            password: 'password123',
        });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data.user.email).toBe('test@transitops.in');
        accessToken = res.body.data.accessToken;
    });
    it('should get current user with valid token', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('test@transitops.in');
    });
    it('should return 401 on wrong password and increment failed attempts', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'test@transitops.in',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        expect(user?.failedLoginAttempts).toBeGreaterThan(0);
    });
    it('should lock out account after 5 failed attempts', async () => {
        // We already have 1 failed attempt, do 4 more
        for (let i = 0; i < 4; i++) {
            await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@transitops.in',
                password: 'wrongpassword',
            });
        }
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'test@transitops.in',
            password: 'wrongpassword',
        });
        // The 5th failure sets lock (or the 6th attempt is blocked)
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/Account locked/);
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        expect(user?.lockedUntil).not.toBeNull();
    });
});
