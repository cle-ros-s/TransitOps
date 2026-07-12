import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../../mockApi/driverApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate, getLicenseStatus, daysUntil } from '../../utils/formatDate';
import { DRIVER_STATUSES } from '../../config/constants';
import type { Driver } from '../../types';
import toast from 'react-hot-toast';
import { DriverForm } from './DriverForm';
import { DriverProfileModal } from './DriverProfileModal';

export function DriversPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Driver deleted');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Driver['status'] }) => updateDriver(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver status updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let r = [...drivers];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter((d) => d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
    }
    if (statusFilter) r = r.filter((d) => d.status === statusFilter);
    if (licenseFilter) r = r.filter((d) => getLicenseStatus(d.licenseExpiryDate) === licenseFilter);
    return r;
  }, [drivers, debouncedSearch, statusFilter, licenseFilter]);

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage } = usePagination(filtered, 8);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Driver Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{drivers.length} drivers in the system</p>
        </div>
        {can.drivers && (
          <button onClick={() => { setEditDriver(null); setFormOpen(true); }} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, license, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-9 py-2" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base py-2 w-auto">
            <option value="">All Statuses</option>
            {DRIVER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={licenseFilter} onChange={(e) => setLicenseFilter(e.target.value)} className="input-base py-2 w-auto">
            <option value="">All License Status</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Driver</th>
                <th className="table-header">License No.</th>
                <th className="table-header">Category</th>
                <th className="table-header">License Expiry</th>
                <th className="table-header">Safety Score</th>
                <th className="table-header">Completion %</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={8}><EmptyState title="No drivers found" /></td></tr>
              ) : (
                paginatedItems.map((d) => {
                  const licStatus = getLicenseStatus(d.licenseExpiryDate);
                  const days = daysUntil(d.licenseExpiryDate);
                  return (
                    <tr key={d.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold flex-shrink-0">
                            {d.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{d.name}</p>
                            <p className="text-[11px] text-gray-400">{d.contactNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs">{d.licenseNumber}</td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-semibold">Cat. {d.licenseCategory}</span>
                      </td>
                      <td className="table-cell">
                        <div>
                          <StatusBadge status={licStatus} />
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDate(d.licenseExpiryDate)}
                            {days < 0 ? ` (${Math.abs(days)}d ago)` : ` (${days}d left)`}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-20">
                            <div
                              className={`h-full rounded-full ${d.safetyScore >= 85 ? 'bg-emerald-500' : d.safetyScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${d.safetyScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{d.safetyScore}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`text-xs font-semibold ${d.tripCompletionRate >= 90 ? 'text-emerald-600' : d.tripCompletionRate >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                          {d.tripCompletionRate}%
                        </span>
                      </td>
                      <td className="table-cell"><StatusBadge status={d.status} showDot /></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewDriver(d)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg" title="View Profile">
                            <Eye className="w-4 h-4" />
                          </button>
                          {can.drivers && (
                            <>
                              <button onClick={() => { setEditDriver(d); setFormOpen(true); }} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 rounded-lg">
                                <Pencil className="w-4 h-4" />
                              </button>
                              {d.status !== 'suspended' ? (
                                <button onClick={() => statusMutation.mutate({ id: d.id, status: 'suspended' })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg" title="Suspend">
                                  <UserX className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => statusMutation.mutate({ id: d.id, status: 'available' })} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 rounded-lg" title="Reinstate">
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => setDeleteTarget(d)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800">
          <Pagination page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} onPage={goToPage} total={filtered.length} pageSize={8} />
        </div>
      </div>

      {formOpen && <DriverForm driver={editDriver} onClose={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); queryClient.invalidateQueries({ queryKey: ['drivers'] }); }} />}
      {viewDriver && <DriverProfileModal driver={viewDriver} onClose={() => setViewDriver(null)} />}
      <ConfirmDialog isOpen={!!deleteTarget} title="Delete Driver" message={`Delete ${deleteTarget?.name}? This cannot be undone.`} variant="danger" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
