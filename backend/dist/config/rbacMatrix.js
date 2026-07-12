"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacMatrix = void 0;
exports.rbacMatrix = {
    FLEET_MANAGER: {
        vehicles: 'full',
        drivers: 'full',
        trips: 'none',
        maintenance: 'full',
        fuel_expenses: 'none',
        analytics: 'view',
        settings: 'full',
        dashboard: 'full',
    },
    DISPATCHER: {
        vehicles: 'view',
        drivers: 'none',
        trips: 'full',
        maintenance: 'none',
        fuel_expenses: 'none',
        analytics: 'none',
        settings: 'none',
        dashboard: 'full',
    },
    SAFETY_OFFICER: {
        vehicles: 'none',
        drivers: 'full',
        trips: 'view',
        maintenance: 'none',
        fuel_expenses: 'none',
        analytics: 'none',
        settings: 'none',
        dashboard: 'full',
    },
    FINANCIAL_ANALYST: {
        vehicles: 'view',
        drivers: 'none',
        trips: 'none',
        maintenance: 'none',
        fuel_expenses: 'full',
        analytics: 'full',
        settings: 'none',
        dashboard: 'full',
    },
};
