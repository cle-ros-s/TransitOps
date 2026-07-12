import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Download, Filter, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../mockApi/vehicleApi';
import { useVehicleStore } from '../../store/vehicleStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { VehicleForm } from './VehicleForm';
import { VehicleDetailModal } from './VehicleDetailModal';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { buildCsv, downloadCsv } from '../../utils/csvBuilder';
import { formatCurrency } from '../../utils/formatCurrency';
import { VEHICLE_TYPES, VEHICLE_STATUSES, REGIONS } from '../../config/constants';
import type { Vehicle } from '../../types';
import toast from 'react-hot-toast';

export function VehicleRegistryPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Vehicle>('registrationNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let result = [...vehicles];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((v) =>
        v.registrationNumber.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((v) => v.type === typeFilter);
    if (statusFilter) result = result.filter((v) => v.status === statusFilter);
    if (regionFilter) result = result.filter((v) => v.region === regionFilter);
    result.sort((a, b) => {
      const av = String(a[sortField] ?? ''), bv = String(b[sortField] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return result;
  }, [vehicles, debouncedSearch, typeFilter, statusFilter, regionFilter, sortField, sortDir]);

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage } = usePagination(filtered, 8);

  function handleSort(field: keyof Vehicle) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function handleExportCsv() {
    const csv = buildCsv(filtered, [
      { key: 'registrationNumber', label: 'Reg. Number' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'region', label: 'Region' },
      { key: 'maxLoadCapacity', label: 'Max Load (kg)' },
      { key: 'odometer', label: 'Odometer (km)' },
      { key: 'acquisitionCost', label: 'Acquisition Cost' },
      { key: 'revenue', label: 'Revenue' },
    ]);
    downloadCsv(csv, `vehicles_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSV exported');
  }

  const SortHeader = ({ field, label }: { field: keyof Vehicle; label: string }) => (
    <th
      className="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-gray-300">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vehicle Registry</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicles.length} vehicles in fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleExportCsv} className="btn-secondary text-sm"><Download className="w-4 h-4" /> Export CSV</button>
          {can.vehiclesFull && (
            <button onClick={() => { setEditingVehicle(null); setFormOpen(true); }} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reg. number, name, make..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 py-2"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base py-2 w-auto">
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base py-2 w-auto">
            <option value="">All Statuses</option>
            {VEHICLE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="input-base py-2 w-auto">
            <option value="">All Regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {(search || typeFilter || statusFilter || regionFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setRegionFilter(''); }} className="btn-ghost text-sm text-red-500">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <SortHeader field="registrationNumber" label="Reg. Number" />
                <SortHeader field="name" label="Vehicle Name" />
                <SortHeader field="type" label="Type" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="region" label="Region" />
                <SortHeader field="maxLoadCapacity" label="Max Load" />
                <SortHeader field="odometer" label="Odometer" />
                <SortHeader field="revenue" label="Revenue" />
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No vehicles found" description="Try adjusting your search or filters" />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((v) => (
                  <tr key={v.id} className="table-row">
                    <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{v.registrationNumber}</td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{v.name}</p>
                        <p className="text-[11px] text-gray-400">{v.make} {v.model} {v.year}</p>
                      </div>
                    </td>
                    <td className="table-cell capitalize">{v.type}</td>
                    <td className="table-cell"><StatusBadge status={v.status} showDot /></td>
                    <td className="table-cell text-gray-500">{v.region}</td>
                    <td className="table-cell">{v.maxLoadCapacity.toLocaleString()} kg</td>
                    <td className="table-cell">{v.odometer.toLocaleString()} km</td>
                    <td className="table-cell font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(v.revenue)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingVehicle(v)}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {can.vehiclesFull && (
                          <>
                            <button
                              onClick={() => { setEditingVehicle(v); setFormOpen(true); }}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(v)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800">
          <Pagination page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} onPage={goToPage} total={filtered.length} pageSize={8} />
        </div>
      </div>

      {/* Forms & Modals */}
      {formOpen && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }}
        />
      )}
      {viewingVehicle && (
        <VehicleDetailModal vehicle={viewingVehicle} onClose={() => setViewingVehicle(null)} />
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${deleteTarget?.registrationNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
