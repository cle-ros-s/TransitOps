import type { UserRole } from '@prisma/client';

export type Permission =
  | 'vehicles:read' | 'vehicles:write' | 'vehicles:delete'
  | 'drivers:read' | 'drivers:write' | 'drivers:delete'
  | 'trips:read' | 'trips:write' | 'trips:delete'
  | 'trips:dispatch' | 'trips:complete' | 'trips:cancel'
  | 'maintenance:read' | 'maintenance:write' | 'maintenance:delete'
  | 'fuel:read' | 'fuel:write' | 'fuel:delete'
  | 'expenses:read' | 'expenses:write' | 'expenses:delete'
  | 'analytics:read'
  | 'dashboard:read'
  | 'notifications:read' | 'notifications:write'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'users:read' | 'users:write';

type RBACMatrix = Record<UserRole, Permission[]>;

export const RBAC_MATRIX: RBACMatrix = {
  fleet_manager: [
    'vehicles:read', 'vehicles:write', 'vehicles:delete',
    'drivers:read', 'drivers:write', 'drivers:delete',
    'trips:read', 'trips:write', 'trips:delete', 'trips:dispatch', 'trips:complete', 'trips:cancel',
    'maintenance:read', 'maintenance:write', 'maintenance:delete',
    'fuel:read', 'fuel:write', 'fuel:delete',
    'expenses:read', 'expenses:write', 'expenses:delete',
    'analytics:read',
    'dashboard:read',
    'notifications:read', 'notifications:write',
    'settings:read', 'settings:write',
    'audit:read',
    'users:read', 'users:write',
  ],
  dispatcher: [
    'vehicles:read',
    'drivers:read',
    'trips:read', 'trips:write', 'trips:dispatch', 'trips:complete', 'trips:cancel',
    'dashboard:read',
    'notifications:read', 'notifications:write',
    'settings:read',
  ],
  safety_officer: [
    'vehicles:read',
    'drivers:read',
    'trips:read',
    'maintenance:read',
    'dashboard:read',
    'notifications:read', 'notifications:write',
    'settings:read',
  ],
  financial_analyst: [
    'vehicles:read',
    'fuel:read', 'fuel:write',
    'expenses:read', 'expenses:write',
    'analytics:read',
    'dashboard:read',
    'notifications:read', 'notifications:write',
    'settings:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RBAC_MATRIX[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
