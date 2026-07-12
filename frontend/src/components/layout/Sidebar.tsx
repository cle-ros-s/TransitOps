import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route, Wrench,
  Fuel, BarChart3, Settings, ChevronLeft, ChevronRight,
  TrendingUp, Wallet
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  {
    group: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    ]
  },
  {
    group: 'Fleet Management',
    items: [
      { label: 'Vehicles', path: '/vehicles', icon: Truck, permission: 'vehicles' },
      { label: 'Drivers', path: '/drivers', icon: Users, permission: 'drivers' },
      { label: 'Trips', path: '/trips', icon: Route, permission: 'trips' },
      { label: 'Maintenance', path: '/maintenance', icon: Wrench, permission: 'maintenance' },
    ]
  },
  {
    group: 'Finance',
    items: [
      { label: 'Fuel & Expenses', path: '/fuel-expenses', icon: Fuel, permission: 'fuel' },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { label: 'Reports', path: '/analytics', icon: BarChart3, permission: 'analytics' },
    ]
  },
  {
    group: 'Administration',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings' },
    ]
  },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { hasPermission } = usePermissions();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-sidebar flex flex-col h-full flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="ml-3 overflow-hidden"
            >
              <p className="text-white font-bold text-sm leading-tight">TransitOps</p>
              <p className="text-sidebar-text text-[10px] leading-tight">Transport Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded-lg hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-text-active transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6 no-scrollbar">
        {NAV_ITEMS.map((group) => {
          const visibleItems = group.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text px-3 mb-2 truncate">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium group',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'text-brand-400 bg-sidebar-active'
                          : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-brand-400' : '')} />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom version */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-text">TransitOps v1.0.0</p>
        </div>
      )}
    </motion.aside>
  );
}
