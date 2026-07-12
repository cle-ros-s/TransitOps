"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errors_1 = require("../utils/errors");
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError(`Role '${req.user?.role}' is not permitted here`);
        }
        next();
    };
}
