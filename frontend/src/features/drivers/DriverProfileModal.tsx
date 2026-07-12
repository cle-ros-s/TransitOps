import { X, Phone, Mail, MapPin, Calendar, Award, TrendingUp } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, getLicenseStatus } from '../../utils/formatDate';
import type { Driver } from '../../types';

export function DriverProfileModal({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const licStatus = getLicenseStatus(driver.licenseExpiryDate);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Driver Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-2xl font-bold">
              {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{driver.name}</h3>
              <p className="text-sm text-gray-500">{driver.licenseNumber}</p>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={driver.status} showDot />
                <span className="status-badge bg-gray-100 dark:bg-gray-800 text-gray-600">Cat. {driver.licenseCategory}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-400 mb-1">Safety Score</p>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-gray-800 dark:text-gray-200">{driver.safetyScore}/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className={`h-full rounded-full ${driver.safetyScore >= 85 ? 'bg-emerald-500' : driver.safetyScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${driver.safetyScore}%` }} /></div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-400 mb-1">Trip Completion</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-gray-800 dark:text-gray-200">{driver.tripCompletionRate}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className="h-full rounded-full bg-blue-500" style={{ width: `${driver.tripCompletionRate}%` }} /></div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { icon: Phone, label: driver.contactNumber },
              { icon: Mail, label: driver.email },
              { icon: MapPin, label: driver.address },
              { icon: Calendar, label: `Joined: ${formatDate(driver.joinDate)}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 mb-1">License Details</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Expires: {formatDate(driver.licenseExpiryDate)}</p>
                <p className="text-xs text-gray-400">Total Trips: {driver.totalTrips}</p>
              </div>
              <StatusBadge status={licStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
