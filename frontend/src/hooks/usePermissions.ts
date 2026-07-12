import { useAuthStore } from '../store/authStore';
import { ROLE_PERMISSIONS } from '../config/constants';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] ?? [];
    return perms.includes(permission);
  };

  const can = {
    vehicles: hasPermission('vehicles') || hasPermission('vehicles_view'),
    vehiclesFull: hasPermission('vehicles'),
    drivers: hasPermission('drivers'),
    trips: hasPermission('trips') || hasPermission('trips_view'),
    tripsFull: hasPermission('trips'),
    maintenance: hasPermission('maintenance'),
    fuel: hasPermission('fuel'),
    expenses: hasPermission('expenses'),
    reports: hasPermission('reports'),
    analytics: hasPermission('analytics'),
    dashboard: hasPermission('dashboard'),
    settings: user?.role === 'fleet_manager',
  };

  return { hasPermission, can, role: user?.role };
}
