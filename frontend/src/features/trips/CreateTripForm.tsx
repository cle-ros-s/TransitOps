import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';
import { createTrip } from '../../mockApi/tripApi';
import { isVehicleDispatchable, isDriverDispatchable, validateCargoWeight } from '../../mockApi/rules';
import type { Vehicle, Driver } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  source: z.string().min(1, 'Required'),
  destination: z.string().min(1, 'Required'),
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  cargoWeight: z.coerce.number().min(0),
  plannedDistance: z.coerce.number().min(1, 'Required'),
  revenue: z.coerce.number().min(0),
  startDate: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateTripFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTripForm({ vehicles, drivers, onClose, onSuccess }: CreateTripFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: '', destination: '', vehicleId: '', driverId: '',
      cargoWeight: 0, plannedDistance: 0, revenue: 0,
      startDate: new Date().toISOString().split('T')[0], notes: '',
    },
  });

  const watchedVehicleId = watch('vehicleId');
  const watchedCargo = watch('cargoWeight');

  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);
  const cargoValidation = selectedVehicle
    ? validateCargoWeight(Number(watchedCargo), selectedVehicle.maxLoadCapacity)
    : null;

  const dispatchableVehicles = vehicles.filter(isVehicleDispatchable);
  const dispatchableDrivers = drivers.filter((d) => isDriverDispatchable(d));

  async function onSubmit(data: FormData) {
    if (cargoValidation && !cargoValidation.valid) {
      toast.error(`Cargo exceeds vehicle capacity by ${cargoValidation.excessKg} kg`);
      return;
    }
    setLoading(true);
    try {
      await createTrip({ ...data, status: 'draft' });
      toast.success('Trip created successfully');
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
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Create New Trip</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Route */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Source *</label>
              <input {...register('source')} className="input-base" placeholder="Mumbai" />
              {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source.message}</p>}
            </div>
            <div>
              <label className="label-base">Destination *</label>
              <input {...register('destination')} className="input-base" placeholder="Pune" />
              {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <label className="label-base">
              Vehicle * <span className="text-gray-400 font-normal text-xs">(only available vehicles shown)</span>
            </label>
            <select {...register('vehicleId')} className="input-base">
              <option value="">Select vehicle...</option>
              {dispatchableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.name} (max: {v.maxLoadCapacity.toLocaleString()} kg)
                </option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
            {dispatchableVehicles.length === 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">⚠ No vehicles available for dispatch</p>
            )}
          </div>

          {/* Driver */}
          <div>
            <label className="label-base">
              Driver * <span className="text-gray-400 font-normal text-xs">(suspended/expired license excluded)</span>
            </label>
            <select {...register('driverId')} className="input-base">
              <option value="">Select driver...</option>
              {dispatchableDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.licenseNumber}</option>
              ))}
            </select>
            {errors.driverId && <p className="text-red-500 text-xs mt-1">{errors.driverId.message}</p>}
            {dispatchableDrivers.length === 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">⚠ No eligible drivers available</p>
            )}
          </div>

          {/* Cargo Weight */}
          <div>
            <label className="label-base">Cargo Weight (kg) *</label>
            <input
              type="number"
              {...register('cargoWeight')}
              className={`input-base ${cargoValidation && !cargoValidation.valid ? 'border-red-400 focus:ring-red-500' : ''}`}
            />
            {cargoValidation && !cargoValidation.valid && (
              <div className="flex items-center gap-2 mt-1.5 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-xs">
                  ❌ Capacity exceeded by <strong>{cargoValidation.excessKg.toLocaleString()} kg</strong>.
                  Vehicle max: {selectedVehicle!.maxLoadCapacity.toLocaleString()} kg
                </p>
              </div>
            )}
            {cargoValidation && cargoValidation.valid && Number(watchedCargo) > 0 && (
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                ✓ Within capacity ({selectedVehicle!.maxLoadCapacity.toLocaleString()} kg max)
              </p>
            )}
          </div>

          {/* Distance + Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Planned Distance (km) *</label>
              <input type="number" {...register('plannedDistance')} className="input-base" />
              {errors.plannedDistance && <p className="text-red-500 text-xs mt-1">{errors.plannedDistance.message}</p>}
            </div>
            <div>
              <label className="label-base">Revenue (₹)</label>
              <input type="number" {...register('revenue')} className="input-base" />
            </div>
          </div>

          <div>
            <label className="label-base">Start Date *</label>
            <input type="date" {...register('startDate')} className="input-base" />
          </div>

          <div>
            <label className="label-base">Notes</label>
            <textarea {...register('notes')} rows={2} className="input-base resize-none" placeholder="Optional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={loading || (cargoValidation ? !cargoValidation.valid : false)}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
