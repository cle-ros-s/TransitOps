import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, List, LayoutGrid, Route } from 'lucide-react';
import { getTrips, dispatchTrip, cancelTrip, deleteTrip } from '../../mockApi/tripApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { getDrivers } from '../../mockApi/driverApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePermissions } from '../../hooks/usePermissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Trip } from '../../types';
import toast from 'react-hot-toast';
import { CreateTripForm } from './CreateTripForm';
import { CompleteTripModal } from './CompleteTripModal';

export function TripDispatcherPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Trip | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const { data: trips = [], isLoading, refetch } = useQuery({ queryKey: ['trips'], queryFn: getTrips });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const dispatchMutation = useMutation({
    mutationFn: dispatchTrip,
    onSuccess: (t) => { invalidate(); toast.success(`Trip ${t.tripNumber} dispatched!`); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelTrip(id, reason),
    onSuccess: (t) => { invalidate(); toast.success(`Trip ${t.tripNumber} cancelled`); setCancelTarget(null); setCancelReason(''); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => { invalidate(); toast.success('Trip deleted'); setDeleteTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const getVehicleName = (id: string) => vehicles.find((v) => v.id === id)?.registrationNumber ?? id;
  const getDriverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  const columns = [
    { status: 'draft', label: 'Draft', color: 'border-t-gray-400' },
    { status: 'dispatched', label: 'Dispatched', color: 'border-t-blue-500' },
    { status: 'completed', label: 'Completed', color: 'border-t-emerald-500' },
    { status: 'cancelled', label: 'Cancelled', color: 'border-t-red-400' },
  ];

  const TripCard = ({ trip }: { trip: Trip }) => (
    <div className="card p-4 space-y-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400">{trip.tripNumber}</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{trip.source} → {trip.destination}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>🚛 {getVehicleName(trip.vehicleId)}</p>
        <p>👤 {getDriverName(trip.driverId)}</p>
        <p>📦 {trip.cargoWeight.toLocaleString()} kg · {trip.plannedDistance} km</p>
        <p>💰 {formatCurrency(trip.revenue)}</p>
        <p>📅 {formatDate(trip.startDate)}</p>
      </div>
      {trip.cancellationReason && (
        <p className="text-xs text-red-500 italic border-t border-red-100 dark:border-red-900/20 pt-2">{trip.cancellationReason}</p>
      )}
      {trip.status === 'completed' && trip.fuelConsumed && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 border-t border-emerald-100 dark:border-emerald-900/20 pt-2">
          ✓ {trip.fuelConsumed}L fuel · {trip.actualDistance ?? trip.plannedDistance} km actual
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
        {trip.status === 'draft' && can.tripsFull && (
          <>
            <button
              onClick={() => dispatchMutation.mutate(trip.id)}
              disabled={dispatchMutation.isPending}
              className="text-xs btn-primary py-1 px-2"
            >
              Dispatch
            </button>
            <button
              onClick={() => setDeleteTarget(trip)}
              className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </>
        )}
        {trip.status === 'dispatched' && can.tripsFull && (
          <>
            <button
              onClick={() => setCompleteTrip(trip)}
              className="text-xs px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              Complete
            </button>
            <button
              onClick={() => { setCancelTarget(trip); setCancelReason(''); }}
              className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trip Dispatcher</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{trips.length} total trips</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw className="w-4 h-4" /></button>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 transition-colors ${viewMode === 'board' ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'}`}
              title="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {can.tripsFull && (
            <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Create Trip
            </button>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTrips = trips.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={`bg-gray-50 dark:bg-gray-900/50 rounded-xl border-t-4 ${col.color} p-3 min-h-64`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{col.label}</h3>
                  <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 shadow-sm">{colTrips.length}</span>
                </div>
                {colTrips.length === 0 ? (
                  <div className="text-center py-8 text-gray-300 dark:text-gray-600 text-xs">No trips</div>
                ) : (
                  <div className="space-y-3">
                    {colTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Trip No.</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Driver</th>
                  <th className="table-header">Cargo</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="table-row">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="table-cell"><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : trips.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={Route} title="No trips found" /></td></tr>
                ) : (
                  trips.map((trip) => (
                    <tr key={trip.id} className="table-row">
                      <td className="table-cell font-bold text-brand-600 dark:text-brand-400">{trip.tripNumber}</td>
                      <td className="table-cell font-medium">{trip.source} → {trip.destination}</td>
                      <td className="table-cell">{getVehicleName(trip.vehicleId)}</td>
                      <td className="table-cell">{getDriverName(trip.driverId)}</td>
                      <td className="table-cell">{trip.cargoWeight.toLocaleString()} kg</td>
                      <td className="table-cell text-emerald-600 font-medium">{formatCurrency(trip.revenue)}</td>
                      <td className="table-cell text-gray-400 text-xs">{formatDate(trip.startDate)}</td>
                      <td className="table-cell"><StatusBadge status={trip.status} showDot /></td>
                      <td className="table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {trip.status === 'draft' && can.tripsFull && (
                            <button onClick={() => dispatchMutation.mutate(trip.id)} className="text-xs btn-primary py-1 px-2">Dispatch</button>
                          )}
                          {trip.status === 'dispatched' && can.tripsFull && (
                            <>
                              <button onClick={() => setCompleteTrip(trip)} className="text-xs px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">Complete</button>
                              <button onClick={() => { setCancelTarget(trip); setCancelReason(''); }} className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg">Cancel</button>
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
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateTripForm
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); invalidate(); }}
        />
      )}
      {completeTrip && (
        <CompleteTripModal
          trip={completeTrip}
          onClose={() => setCompleteTrip(null)}
          onSuccess={() => { setCompleteTrip(null); invalidate(); }}
        />
      )}

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Trip"
        message={`This will cancel trip ${cancelTarget?.tripNumber} and restore vehicle & driver to Available status.`}
        confirmLabel="Cancel Trip"
        variant="warning"
        onConfirm={() => cancelTarget && cancelMutation.mutate({ id: cancelTarget.id, reason: cancelReason || 'Cancelled by operator' })}
        onCancel={() => { setCancelTarget(null); setCancelReason(''); }}
      >
        <div>
          <label className="label-base">Cancellation Reason</label>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter reason for cancellation..."
            className="input-base"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Trip"
        message={`Delete trip ${deleteTarget?.tripNumber}? This cannot be undone.`}
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
