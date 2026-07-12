import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: string;
}

export function RoleGuard({ children, permission, fallback = '/dashboard' }: RoleGuardProps) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
