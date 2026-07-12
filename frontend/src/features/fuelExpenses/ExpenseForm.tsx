import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createExpense } from '../../mockApi/fuelExpenseApi';
import type { Vehicle, Trip } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  tripId: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  toll: z.coerce.number().min(0),
  otherExpenses: z.coerce.number().min(0),
  maintenanceCost: z.coerce.number().min(0),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ExpenseForm({
  vehicles,
  trips,
  onClose,
  onSuccess,
}: {
  vehicles: Vehicle[];
  trips: Trip[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: '',
      tripId: '',
      date: new Date().toISOString().split('T')[0],
      toll: 0,
      otherExpenses: 0,
      maintenanceCost: 0,
      description: '',
    },
  });

  const toll = watch('toll');
  const other = watch('otherExpenses');
  const maintenance = watch('maintenanceCost');
  const total = (Number(toll) || 0) + (Number(other) || 0) + (Number(maintenance) || 0);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createExpense({ ...data, totalCost: total });
      toast.success('Expense added');
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
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Add Expense</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Vehicle *</label>
              <select {...register('vehicleId')} className="input-base">
                <option value="">Select...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
            </div>
            <div>
              <label className="label-base">Trip *</label>
              <select {...register('tripId')} className="input-base">
                <option value="">Select...</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.tripNumber} — {t.source}→{t.destination}</option>
                ))}
              </select>
              {errors.tripId && <p className="text-red-500 text-xs mt-1">{errors.tripId.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-base">Date *</label>
            <input type="date" {...register('date')} className="input-base" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Toll (₹)</label>
              <input type="number" {...register('toll')} className="input-base" />
            </div>
            <div>
              <label className="label-base">Other (₹)</label>
              <input type="number" {...register('otherExpenses')} className="input-base" />
            </div>
            <div>
              <label className="label-base">Maintenance (₹)</label>
              <input type="number" {...register('maintenanceCost')} className="input-base" />
            </div>
          </div>

          {total > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                Total Expense: <strong>₹{total.toFixed(2)}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="label-base">Description</label>
            <input {...register('description')} className="input-base" placeholder="Optional description..." />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
