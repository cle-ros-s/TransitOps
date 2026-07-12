import { cn } from '../../lib/utils';

type BadgeVariant = 'available' | 'on_trip' | 'in_shop' | 'retired' | 'draft' | 'dispatched' | 'completed' | 'cancelled' | 'active' | 'off_duty' | 'suspended' | 'valid' | 'expiring_soon' | 'expired' | 'success' | 'warning' | 'info' | 'error';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  on_trip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_shop: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  retired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  active: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  off_duty: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  valid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expiring_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const BADGE_LABELS: Partial<Record<BadgeVariant, string>> = {
  available: 'Available',
  on_trip: 'On Trip',
  in_shop: 'In Shop',
  retired: 'Retired',
  draft: 'Draft',
  dispatched: 'Dispatched',
  completed: 'Completed',
  cancelled: 'Cancelled',
  active: 'Active',
  off_duty: 'Off Duty',
  suspended: 'Suspended',
  valid: 'Valid',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

const DOT_COLORS: Partial<Record<BadgeVariant, string>> = {
  available: 'bg-emerald-500',
  on_trip: 'bg-blue-500',
  in_shop: 'bg-amber-500',
  dispatched: 'bg-blue-500',
  active: 'bg-amber-500',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, showDot = false, className }: StatusBadgeProps) {
  const displayLabel = label ?? BADGE_LABELS[status] ?? status;
  const dotColor = DOT_COLORS[status];

  return (
    <span className={cn('status-badge', BADGE_STYLES[status], className)}>
      {showDot && dotColor && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      )}
      {displayLabel}
    </span>
  );
}
