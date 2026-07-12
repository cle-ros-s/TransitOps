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
exports.loginHandler = loginHandler;
exports.refreshHandler = refreshHandler;
exports.logoutHandler = logoutHandler;
exports.meHandler = meHandler;
const authService = __importStar(require("./auth.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const jwt_1 = require("../../utils/jwt");
const errors_1 = require("../../utils/errors");
async function loginHandler(req, res) {
    const result = await authService.login(req.body);
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return (0, apiResponse_1.successResponse)(res, {
        user: result.user,
        accessToken: result.accessToken,
    });
}
async function refreshHandler(req, res) {
    const token = req.cookies?.refreshToken;
    if (!token)
        throw new errors_1.UnauthorizedError('No refresh token');
    const payload = (0, jwt_1.verifyRefreshToken)(token);
    const newAccessToken = (0, jwt_1.generateAccessToken)({
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
    });
    return (0, apiResponse_1.successResponse)(res, { accessToken: newAccessToken });
}
async function logoutHandler(_req, res) {
    res.clearCookie('refreshToken');
    return (0, apiResponse_1.successResponse)(res, { message: 'Logged out' });
}
async function meHandler(req, res) {
    const user = await authService.getUserById(req.user.userId);
    return (0, apiResponse_1.successResponse)(res, user);
}
