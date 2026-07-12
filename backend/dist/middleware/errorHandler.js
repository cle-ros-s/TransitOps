"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
function errorHandler(error, _req, res, _next) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Error:', error.message);
    }
    if (error instanceof errors_1.AppError) {
        res.status(error.statusCode).json({
            error: { message: error.message, code: error.code },
        });
        return;
    }
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({
            error: {
                message: 'Validation error',
                code: 'VALIDATION_ERROR',
                details: error.errors,
            },
        });
        return;
    }
    res.status(500).json({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
}
