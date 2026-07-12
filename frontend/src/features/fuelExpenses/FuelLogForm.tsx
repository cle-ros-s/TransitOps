import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createFuelLog } from '../../mockApi/fuelExpenseApi';
import type { Vehicle } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  liters: z.coerce.number().min(0.1, 'Must be > 0'),
  costPerLiter: z.coerce.number().min(0.1, 'Must be > 0'),
  odometer: z.coerce.number().min(0),
  fuelStation: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function FuelLogForm({
  vehicles,
  onClose,
  onSuccess,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      liters: 0,
      costPerLiter: 91.5,
      odometer: 0,
      fuelStation: '',
    },
  });

  const liters = watch('liters');
  const costPerLiter = watch('costPerLiter');
  const total = (Number(liters) || 0) * (Number(costPerLiter) || 0);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createFuelLog({ ...data, totalCost: total });
      toast.success('Fuel log added');
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
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Add Fuel Log</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label-base">Vehicle *</label>
            <select {...register('vehicleId')} className="input-base">
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Date *</label>
              <input type="date" {...register('date')} className="input-base" />
            </div>
            <div>
              <label className="label-base">Odometer (km)</label>
              <input type="number" {...register('odometer')} className="input-base" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Liters *</label>
              <input type="number" step="0.1" {...register('liters')} className="input-base" />
              {errors.liters && <p className="text-red-500 text-xs mt-1">{errors.liters.message}</p>}
            </div>
            <div>
              <label className="label-base">Cost per Liter (₹) *</label>
              <input type="number" step="0.01" {...register('costPerLiter')} className="input-base" />
            </div>
          </div>

          {total > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Total Cost: <strong>₹{total.toFixed(2)}</strong>
                <span className="text-amber-500 ml-2">({Number(liters).toFixed(1)}L × ₹{Number(costPerLiter).toFixed(2)})</span>
              </p>
            </div>
          )}

          <div>
            <label className="label-base">Fuel Station</label>
            <input {...register('fuelStation')} className="input-base" placeholder="Station name" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Add Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
