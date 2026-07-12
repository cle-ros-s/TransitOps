import { create } from 'zustand';
import type { Vehicle } from '../types';

interface VehicleState {
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  upsertVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
}

export const useVehicleStore = create<VehicleState>()((set) => ({
  vehicles: [],
  setVehicles: (vehicles) => set({ vehicles }),
  upsertVehicle: (vehicle) =>
    set((s) => ({
      vehicles: s.vehicles.some((v) => v.id === vehicle.id)
        ? s.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v))
        : [...s.vehicles, vehicle],
    })),
  removeVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),
}));
