import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createMaintenance } from '../../mockApi/maintenanceApi';
import { SERVICE_TYPES } from '../../config/constants';
import type { Vehicle } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceType: z.enum([
    'oil_change', 'tire_replacement', 'brake_service', 'engine_repair',
    'body_repair', 'electrical', 'ac_service', 'general_service', 'inspection',
  ]),
  description: z.string().min(1, 'Required'),
  estimatedCost: z.coerce.number().min(0),
  scheduledDate: z.string().min(1, 'Required'),
  technician: z.string().optional(),
  workshopName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ServiceRecordForm({
  vehicles,
  onClose,
  onSuccess,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const availableVehicles = vehicles.filter((v) => v.status === 'available');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: '',
      serviceType: 'oil_change',
      description: '',
      estimatedCost: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      technician: '',
      workshopName: '',
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createMaintenance({ ...data, status: 'active' });
      toast.success('Maintenance scheduled. Vehicle moved to In Shop.');
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
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Schedule Maintenance</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label-base">
              Vehicle * <span className="text-xs text-gray-400 font-normal">(only available vehicles)</span>
            </label>
            <select {...register('vehicleId')} className="input-base">
              <option value="">Select vehicle...</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
            {availableVehicles.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">⚠ No available vehicles to schedule</p>
            )}
          </div>

          <div>
            <label className="label-base">Service Type *</label>
            <select {...register('serviceType')} className="input-base">
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Description *</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input-base resize-none"
              placeholder="Describe the maintenance work required..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Estimated Cost (₹) *</label>
              <input type="number" {...register('estimatedCost')} className="input-base" />
            </div>
            <div>
              <label className="label-base">Scheduled Date *</label>
              <input type="date" {...register('scheduledDate')} className="input-base" />
              {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Workshop Name</label>
              <input {...register('workshopName')} className="input-base" placeholder="City Auto Workshop" />
            </div>
            <div>
              <label className="label-base">Technician</label>
              <input {...register('technician')} className="input-base" placeholder="Technician name" />
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            ⚠ Scheduling maintenance will change the vehicle status to <strong>In Shop</strong>, removing it from dispatch availability.
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Scheduling...' : 'Schedule Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
