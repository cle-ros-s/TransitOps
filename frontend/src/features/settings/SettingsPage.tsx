import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Moon, Sun, Save, Building, BellRing, ShieldCheck, RefreshCw } from 'lucide-react';
import { ROLE_PERMISSIONS, ROLES } from '../../config/constants';
import { db } from '../../mockApi/db';
import toast from 'react-hot-toast';
import type { UserRole } from '../../types';

const SETTINGS_KEY = 'transitops_settings';

interface AppSettings {
  depotName: string;
  currency: string;
  distanceUnit: string;
  notifyLicenseExpiry: boolean;
  notifyMaintenance: boolean;
  notifyTripUpdates: boolean;
  notifyExpenses: boolean;
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    depotName: 'Main Depot — HQ',
    currency: 'INR',
    distanceUnit: 'km',
    notifyLicenseExpiry: true,
    notifyMaintenance: true,
    notifyTripUpdates: true,
    notifyExpenses: false,
  };
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
          value ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Settings saved successfully');
  }

  function resetData() {
    db.reset();
    toast.success('Demo data reset to defaults. Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  }

  const allPermissions = [
    'dashboard', 'vehicles', 'vehicles_view', 'drivers', 'trips', 'trips_view',
    'maintenance', 'fuel', 'expenses', 'reports', 'analytics',
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure your TransitOps workspace</p>
      </div>

      {/* General */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Building className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">General</h2>
        </div>
        <div>
          <label className="label-base">Depot / Company Name</label>
          <input
            type="text"
            value={settings.depotName}
            onChange={(e) => setSettings({ ...settings, depotName: e.target.value })}
            className="input-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="input-base"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="label-base">Distance Unit</label>
            <select
              value={settings.distanceUnit}
              onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })}
              className="input-base"
            >
              <option value="km">Kilometers (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 mb-4">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-500" /> : <Sun className="w-4 h-4 text-brand-500" />}
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Appearance</h2>
        </div>
        <div className="flex gap-3">
          {[
            { key: 'light', label: 'Light Mode', desc: 'Clean and bright', Icon: Sun, iconColor: 'text-amber-500' },
            { key: 'dark', label: 'Dark Mode', desc: 'Easy on the eyes', Icon: Moon, iconColor: 'text-blue-500' },
          ].map(({ key, label, desc, Icon, iconColor }) => (
            <button
              key={key}
              onClick={() => setTheme(key as 'light' | 'dark')}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 ${iconColor}`} />
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
          <BellRing className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
        </div>
        <Toggle
          value={settings.notifyLicenseExpiry}
          onChange={(v) => setSettings({ ...settings, notifyLicenseExpiry: v })}
          label="Driver License Expiry Alerts"
        />
        <Toggle
          value={settings.notifyMaintenance}
          onChange={(v) => setSettings({ ...settings, notifyMaintenance: v })}
          label="Maintenance Due Alerts"
        />
        <Toggle
          value={settings.notifyTripUpdates}
          onChange={(v) => setSettings({ ...settings, notifyTripUpdates: v })}
          label="Trip Status Updates"
        />
        <Toggle
          value={settings.notifyExpenses}
          onChange={(v) => setSettings({ ...settings, notifyExpenses: v })}
          label="Expense Alerts"
        />
      </div>

      {/* RBAC Table */}
      <div className="card p-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 mb-4">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Role Permissions (RBAC)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header text-left">Permission</th>
                {(Object.keys(ROLES) as UserRole[]).map((role) => (
                  <th key={role} className="table-header text-center whitespace-nowrap">{ROLES[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((perm) => (
                <tr key={perm} className="table-row">
                  <td className="table-cell font-medium capitalize text-gray-700 dark:text-gray-300">
                    {perm.replace(/_/g, ' ')}
                  </td>
                  {(Object.keys(ROLES) as UserRole[]).map((role) => (
                    <td key={role} className="table-cell text-center">
                      {ROLE_PERMISSIONS[role].includes(perm) ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 text-base">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current User */}
      {user && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Current Session</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-xs font-semibold">
                {ROLES[user.role]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={saveSettings} className="btn-primary">
          <Save className="w-4 h-4" /> Save Settings
        </button>
        <button
          onClick={resetData}
          className="btn-secondary flex items-center gap-2 text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          <RefreshCw className="w-4 h-4" /> Reset Demo Data
        </button>
      </div>
    </div>
  );
}
