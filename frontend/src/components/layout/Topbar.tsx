import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { UserMenu } from './UserMenu';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

const BREADCRUMBS: Record<string, string[]> = {
  '/dashboard': ['Dashboard'],
  '/vehicles': ['Fleet Management', 'Vehicles'],
  '/drivers': ['Fleet Management', 'Drivers'],
  '/trips': ['Fleet Management', 'Trips'],
  '/maintenance': ['Fleet Management', 'Maintenance'],
  '/fuel-expenses': ['Finance', 'Fuel & Expenses'],
  '/analytics': ['Analytics', 'Reports'],
  '/settings': ['Administration', 'Settings'],
};

export function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const notifications = useUIStore((s) => s.notifications);
  const setDrawerOpen = useUIStore((s) => s.setNotificationDrawerOpen);
  const globalSearch = useUIStore((s) => s.globalSearchQuery);
  const setGlobalSearch = useUIStore((s) => s.setGlobalSearch);
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const crumbs = BREADCRUMBS[location.pathname] ?? [location.pathname.replace('/', '')];

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 gap-4 flex-shrink-0 z-20">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
            <span className={i === crumbs.length - 1 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="input-base pl-9 py-1.5 text-sm w-56 lg:w-72"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Notifications */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* User menu */}
      <UserMenu />
    </header>
  );
}
