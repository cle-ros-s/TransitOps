"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getUserById = getUserById;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const errors_1 = require("../../utils/errors");
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30_000; // 30 seconds
async function login(data) {
    const user = await prismaClient_1.default.user.findUnique({ where: { email: data.email } });
    if (!user)
        throw new errors_1.UnauthorizedError('Invalid credentials');
    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new errors_1.ForbiddenError('Account locked after 5 failed attempts.');
    }
    const passwordValid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
    if (!passwordValid) {
        const attempts = user.failedLoginAttempts + 1;
        const updateData = {
            failedLoginAttempts: attempts,
        };
        if (attempts >= LOCKOUT_THRESHOLD) {
            updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }
        await prismaClient_1.default.user.update({ where: { id: user.id }, data: updateData });
        if (attempts >= LOCKOUT_THRESHOLD) {
            throw new errors_1.ForbiddenError('Account locked after 5 failed attempts.');
        }
        throw new errors_1.UnauthorizedError('Invalid credentials');
    }
    // Reset failed attempts on success
    await prismaClient_1.default.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    const payload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = (0, jwt_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
    };
}
async function getUserById(userId) {
    const user = await prismaClient_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user)
        throw new errors_1.NotFoundError('User not found');
    return user;
}
