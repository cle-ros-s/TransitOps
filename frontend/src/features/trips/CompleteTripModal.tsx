import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { completeTrip } from '../../mockApi/tripApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Trip } from '../../types';
import toast from 'react-hot-toast';

export function CompleteTripModal({ trip, onClose, onSuccess }: { trip: Trip; onClose: () => void; onSuccess: () => void }) {
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [toll, setToll] = useState('0');
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [loading, setLoading] = useState(false);

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);

  async function handleSubmit() {
    if (!finalOdometer || !fuelConsumed) {
      toast.error('Final odometer and fuel consumed are required');
      return;
    }
    const odo = Number(finalOdometer);
    if (vehicle && odo < vehicle.odometer) {
      toast.error(`Final odometer (${odo.toLocaleString()}) cannot be less than current (${vehicle.odometer.toLocaleString()})`);
      return;
    }
    setLoading(true);
    try {
      await completeTrip(trip.id, {
        finalOdometer: odo,
        fuelConsumed: Number(fuelConsumed),
        toll: Number(toll),
        otherExpenses: Number(otherExpenses),
      });
      toast.success('Trip completed! Fuel log and expenses auto-created.');
      onSuccess();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Complete Trip {trip.tripNumber}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Trip summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{trip.source}</strong> → <strong>{trip.destination}</strong>
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Planned: {trip.plannedDistance} km · Revenue: {formatCurrency(trip.revenue)}
            </p>
            {vehicle && (
              <p className="text-gray-400 text-xs">Current odometer: {vehicle.odometer.toLocaleString()} km</p>
            )}
          </div>

          <div>
            <label className="label-base">Final Odometer Reading (km) *</label>
            <input
              type="number"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              className="input-base"
              placeholder={vehicle ? String(vehicle.odometer + trip.plannedDistance) : '0'}
            />
          </div>

          <div>
            <label className="label-base">Fuel Consumed (liters) *</label>
            <input
              type="number"
              value={fuelConsumed}
              onChange={(e) => setFuelConsumed(e.target.value)}
              className="input-base"
              placeholder="e.g. 65"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Toll (₹)</label>
              <input type="number" value={toll} onChange={(e) => setToll(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label-base">Other Expenses (₹)</label>
              <input type="number" value={otherExpenses} onChange={(e) => setOtherExpenses(e.target.value)} className="input-base" />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
            <p className="font-semibold">✓ On completion:</p>
            <p>• Vehicle odometer will update to final reading</p>
            <p>• Fuel log will be auto-created</p>
            <p>• Expense record will be created</p>
            <p>• Vehicle & driver status → Available</p>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Completing...' : 'Complete Trip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
