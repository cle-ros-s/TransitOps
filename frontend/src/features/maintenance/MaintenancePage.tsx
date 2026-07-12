import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, CheckCircle2, Trash2, Wrench } from 'lucide-react';
import { getMaintenanceRecords, closeMaintenance, deleteMaintenance } from '../../mockApi/maintenanceApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ServiceRecordForm } from './ServiceRecordForm';
import { usePermissions } from '../../hooks/usePermissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { SERVICE_TYPES } from '../../config/constants';
import toast from 'react-hot-toast';

export function MaintenancePage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formOpen, setFormOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<{ id: string; actualCost: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: records = [], isLoading, refetch } = useQuery({ queryKey: ['maintenance'], queryFn: getMaintenanceRecords });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const closeMutation = useMutation({
    mutationFn: ({ id, cost }: { id: string; cost?: number }) => closeMaintenance(id, cost),
    onSuccess: () => { invalidate(); toast.success('Maintenance closed. Vehicle now available.'); setCloseTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => { invalidate(); toast.success('Record deleted'); setDeleteTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = statusFilter ? records.filter((r) => r.status === statusFilter) : records;

  const getVehicleName = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.registrationNumber} — ${v.name}` : id;
  };

  const getServiceLabel = (type: string) =>
    SERVICE_TYPES.find((s) => s.value === type)?.label ?? type;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {records.filter((r) => r.status === 'active').length} active ·{' '}
            {records.filter((r) => r.status === 'completed').length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw className="w-4 h-4" /></button>
          {can.maintenance && (
            <button onClick={() => setFormOpen(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Schedule Maintenance
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2">
        {['', 'active', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'active' && records.filter(r => r.status === 'active').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold">
                {records.filter(r => r.status === 'active').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wrench}
            title="No maintenance records"
            description="Schedule maintenance to move a vehicle to In Shop status"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className={`card p-5 space-y-3 border-l-4 ${
                record.status === 'active' ? 'border-l-amber-500' : 'border-l-emerald-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{getVehicleName(record.vehicleId)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getServiceLabel(record.serviceType)}</p>
                </div>
                <StatusBadge status={record.status} />
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{record.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Scheduled</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(record.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Est. Cost</p>
                  <p className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(record.estimatedCost)}</p>
                </div>
                {record.actualCost != null && (
                  <div>
                    <p className="text-gray-400">Actual Cost</p>
                    <p className="font-medium text-emerald-600">{formatCurrency(record.actualCost)}</p>
                  </div>
                )}
                {record.completedDate && (
                  <div>
                    <p className="text-gray-400">Completed</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(record.completedDate)}</p>
                  </div>
                )}
              </div>

              {record.workshopName && (
                <p className="text-xs text-gray-400">
                  🔧 {record.workshopName}{record.technician ? ` · ${record.technician}` : ''}
                </p>
              )}

              {can.maintenance && record.status === 'active' && (
                <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setCloseTarget({ id: record.id, actualCost: String(record.estimatedCost) })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Close Maintenance
                  </button>
                </div>
              )}

              {can.maintenance && (
                <button
                  onClick={() => setDeleteTarget(record.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Record Form Modal */}
      {formOpen && (
        <ServiceRecordForm
          vehicles={vehicles}
          onClose={() => setFormOpen(false)}
          onSuccess={() => { setFormOpen(false); invalidate(); }}
        />
      )}

      {/* Close Maintenance Dialog */}
      <ConfirmDialog
        isOpen={!!closeTarget}
        title="Close Maintenance"
        message="Enter actual cost and confirm. Vehicle will return to Available status."
        confirmLabel="Close Maintenance"
        variant="info"
        onConfirm={() => closeTarget && closeMutation.mutate({ id: closeTarget.id, cost: Number(closeTarget.actualCost) })}
        onCancel={() => setCloseTarget(null)}
      >
        {closeTarget && (
          <div>
            <label className="label-base">Actual Cost (₹)</label>
            <input
              type="number"
              value={closeTarget.actualCost}
              onChange={(e) => setCloseTarget({ ...closeTarget, actualCost: e.target.value })}
              className="input-base"
            />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Maintenance Record"
        message="Delete this maintenance record? This cannot be undone."
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
