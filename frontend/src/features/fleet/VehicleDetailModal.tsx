import { X, FileText, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, getLicenseStatus, daysUntil } from '../../utils/formatDate';
import type { Vehicle, VehicleDocument } from '../../types';

function DocRow({ doc }: { doc: VehicleDocument }) {
  const days = daysUntil(doc.expiryDate);
  const status = days < 0 ? 'expired' : days <= 30 ? 'expiring_soon' : 'valid';
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
          <p className="text-xs text-gray-400">Expires: {formatDate(doc.expiryDate)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function VehicleDetailModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const roi = vehicle.acquisitionCost > 0
    ? ((vehicle.revenue - vehicle.acquisitionCost) / vehicle.acquisitionCost * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <span className="text-2xl">🚛</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{vehicle.registrationNumber}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{vehicle.name}</p>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={vehicle.status} showDot />
                <span className="status-badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">{vehicle.type}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-0 border-b border-gray-100 dark:border-gray-800">
          {[
            { label: 'Odometer', value: `${vehicle.odometer.toLocaleString()} km` },
            { label: 'Revenue', value: formatCurrency(vehicle.revenue), highlight: true },
            { label: 'Acq. Cost', value: formatCurrency(vehicle.acquisitionCost) },
            { label: 'ROI', value: `${roi}%`, highlight: parseFloat(roi) > 0 },
          ].map((s) => (
            <div key={s.label} className="p-4 text-center border-r border-gray-100 dark:border-gray-800 last:border-r-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
              <p className={`font-bold text-sm mt-0.5 ${s.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Make', vehicle.make],
                ['Model', vehicle.model],
                ['Year', String(vehicle.year)],
                ['Color', vehicle.color],
                ['Fuel Type', vehicle.fuelType.toUpperCase()],
                ['Region', vehicle.region],
                ['Max Load', `${vehicle.maxLoadCapacity.toLocaleString()} kg`],
                ['Added', formatDate(vehicle.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 min-w-24">{k}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Documents ({vehicle.documents.length})</h3>
            {vehicle.documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {vehicle.documents.map((doc) => <DocRow key={doc.id} doc={doc} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
