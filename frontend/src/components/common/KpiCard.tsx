import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export function KpiCard({ title, value, subtitle, icon: Icon, iconColor = 'text-brand-600', iconBg = 'bg-brand-50 dark:bg-brand-900/20', trend, className, onClick }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      className={cn('kpi-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
      {trend && (
        <div className={cn('text-xs font-medium flex items-center gap-1', trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-gray-400 font-normal">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
