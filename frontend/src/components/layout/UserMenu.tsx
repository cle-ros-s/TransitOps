import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clearSession } from '../../mockApi/authApi';
import { ROLES } from '../../config/constants';
import toast from 'react-hot-toast';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    clearSession();
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{user.name}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{ROLES[user.role]}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-[10px] font-semibold">
              {ROLES[user.role]}
            </span>
          </div>
          <button
            onClick={() => { navigate('/settings'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
