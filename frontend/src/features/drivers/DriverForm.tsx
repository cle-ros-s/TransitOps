import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createDriver, updateDriver } from '../../mockApi/driverApi';
import { DRIVER_STATUSES, LICENSE_CATEGORIES } from '../../config/constants';
import type { Driver } from '../../types';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  licenseNumber: z.string().min(1, 'Required'),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E']),
  licenseExpiryDate: z.string().min(1, 'Required'),
  contactNumber: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  safetyScore: z.coerce.number().min(0).max(100),
  tripCompletionRate: z.coerce.number().min(0).max(100),
  status: z.enum(['available', 'on_trip', 'off_duty', 'suspended']),
  address: z.string().min(1, 'Required'),
  joinDate: z.string().min(1, 'Required'),
  totalTrips: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface DriverFormProps {
  driver: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DriverForm({ driver, onClose, onSuccess }: DriverFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: driver ? {
      ...driver,
      licenseExpiryDate: driver.licenseExpiryDate.split('T')[0],
      joinDate: driver.joinDate.split('T')[0],
    } : {
      name: '', licenseNumber: '', licenseCategory: 'B', licenseExpiryDate: '',
      contactNumber: '', email: '', safetyScore: 80, tripCompletionRate: 90,
      status: 'available', address: '', joinDate: new Date().toISOString().split('T')[0], totalTrips: 0,
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      if (driver) {
        await updateDriver(driver.id, data);
        toast.success('Driver updated');
      } else {
        await createDriver(data);
        toast.success('Driver added');
      }
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
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">{driver ? 'Edit Driver' : 'Add New Driver'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label-base">Full Name *</label>
            <input {...register('name')} className="input-base" placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label-base">License Number *</label>
            <input {...register('licenseNumber')} className="input-base" placeholder="DL-2021-MH-12345" />
            {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber.message}</p>}
          </div>
          <div>
            <label className="label-base">License Category *</label>
            <select {...register('licenseCategory')} className="input-base">
              {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>Category {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">License Expiry Date *</label>
            <input type="date" {...register('licenseExpiryDate')} className="input-base" />
            {errors.licenseExpiryDate && <p className="text-red-500 text-xs mt-1">{errors.licenseExpiryDate.message}</p>}
          </div>
          <div>
            <label className="label-base">Status</label>
            <select {...register('status')} className="input-base">
              {DRIVER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Contact Number *</label>
            <input {...register('contactNumber')} className="input-base" placeholder="+91-9876543210" />
          </div>
          <div>
            <label className="label-base">Email *</label>
            <input type="email" {...register('email')} className="input-base" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label-base">Safety Score (0-100)</label>
            <input type="number" {...register('safetyScore')} min="0" max="100" className="input-base" />
          </div>
          <div>
            <label className="label-base">Trip Completion %</label>
            <input type="number" {...register('tripCompletionRate')} min="0" max="100" className="input-base" />
          </div>
          <div>
            <label className="label-base">Join Date</label>
            <input type="date" {...register('joinDate')} className="input-base" />
          </div>
          <div>
            <label className="label-base">Total Trips</label>
            <input type="number" {...register('totalTrips')} className="input-base" />
          </div>
          <div className="col-span-2">
            <label className="label-base">Address</label>
            <input {...register('address')} className="input-base" />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : driver ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
