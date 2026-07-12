import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createVehicle, updateVehicle } from '../../mockApi/vehicleApi';
import { VEHICLE_TYPES, REGIONS, VEHICLE_STATUSES } from '../../config/constants';
import type { Vehicle } from '../../types';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({
  registrationNumber: z.string().min(1, 'Required').toUpperCase(),
  name: z.string().min(1, 'Required'),
  type: z.enum(['van', 'truck', 'mini', 'bus', 'trailer']),
  maxLoadCapacity: z.coerce.number().min(0),
  odometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0),
  status: z.enum(['available', 'on_trip', 'in_shop', 'retired']),
  region: z.string().min(1, 'Required'),
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Required'),
  fuelType: z.enum(['diesel', 'petrol', 'cng', 'electric']),
});

type FormData = z.infer<typeof schema>;

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, onClose, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: vehicle ?? {
      registrationNumber: '',
      name: '',
      type: 'van',
      maxLoadCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      revenue: 0,
      status: 'available',
      region: 'North Zone',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: 'White',
      fuelType: 'diesel',
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, data);
        toast.success('Vehicle updated successfully');
      } else {
        await createVehicle({ ...data, documents: [] });
        toast.success('Vehicle added successfully');
      }
      onSuccess();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="label-base">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-2 gap-4">
          <Field label="Registration Number *" name="registrationNumber" error={errors.registrationNumber?.message}>
            <input {...register('registrationNumber')} className="input-base uppercase" placeholder="VAN-01" />
          </Field>
          <Field label="Vehicle Name *" name="name" error={errors.name?.message}>
            <input {...register('name')} className="input-base" placeholder="City Sprinter" />
          </Field>
          <Field label="Type *" name="type" error={errors.type?.message}>
            <select {...register('type')} className="input-base">
              {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Status *" name="status" error={errors.status?.message}>
            <select {...register('status')} className="input-base">
              {VEHICLE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Make *" name="make" error={errors.make?.message}>
            <input {...register('make')} className="input-base" placeholder="Tata" />
          </Field>
          <Field label="Model *" name="model" error={errors.model?.message}>
            <input {...register('model')} className="input-base" placeholder="Ace" />
          </Field>
          <Field label="Year *" name="year" error={errors.year?.message}>
            <input type="number" {...register('year')} className="input-base" />
          </Field>
          <Field label="Color" name="color" error={errors.color?.message}>
            <input {...register('color')} className="input-base" placeholder="White" />
          </Field>
          <Field label="Fuel Type *" name="fuelType" error={errors.fuelType?.message}>
            <select {...register('fuelType')} className="input-base">
              {['diesel', 'petrol', 'cng', 'electric'].map((f) => <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Region *" name="region" error={errors.region?.message}>
            <select {...register('region')} className="input-base">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Max Load Capacity (kg) *" name="maxLoadCapacity" error={errors.maxLoadCapacity?.message}>
            <input type="number" {...register('maxLoadCapacity')} className="input-base" />
          </Field>
          <Field label="Odometer (km)" name="odometer" error={errors.odometer?.message}>
            <input type="number" {...register('odometer')} className="input-base" />
          </Field>
          <Field label="Acquisition Cost (₹) *" name="acquisitionCost" error={errors.acquisitionCost?.message}>
            <input type="number" {...register('acquisitionCost')} className="input-base" />
          </Field>
          <Field label="Revenue (₹)" name="revenue" error={errors.revenue?.message}>
            <input type="number" {...register('revenue')} className="input-base" />
          </Field>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
