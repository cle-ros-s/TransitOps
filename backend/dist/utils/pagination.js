"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
function getPaginationParams(req, defaultSortBy = 'createdAt', defaultSortDir = 'desc') {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const sortBy = req.query.sortBy || defaultSortBy;
    const sortDir = (req.query.sortDir === 'asc' ? 'asc' : defaultSortDir);
    return { page, pageSize, skip, take, sortBy, sortDir };
}
