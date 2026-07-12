"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const rbacMatrix_1 = require("../config/rbacMatrix");
const errors_1 = require("../utils/errors");
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function requirePermission(resource) {
    return (req, _res, next) => {
        const role = req.user?.role;
        if (!role)
            throw new errors_1.ForbiddenError('Not authenticated');
        const matrix = rbacMatrix_1.rbacMatrix[role];
        if (!matrix)
            throw new errors_1.ForbiddenError('Unknown role');
        const permission = matrix[resource];
        if (permission === 'none') {
            throw new errors_1.ForbiddenError(`Role '${role}' cannot access '${resource}'`);
        }
        if (permission === 'view' && !READ_METHODS.has(req.method)) {
            throw new errors_1.ForbiddenError(`Role '${role}' has read-only access to '${resource}'`);
        }
        // 'full' passes all methods
        next();
    };
}
