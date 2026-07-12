"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(res, data, status = 200) {
    return res.status(status).json({ data });
}
function errorResponse(res, message, code, status) {
    return res.status(status).json({ error: { message, code } });
}
