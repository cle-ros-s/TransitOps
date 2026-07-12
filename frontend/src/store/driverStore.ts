import { create } from 'zustand';
import type { Driver } from '../types';

interface DriverState {
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
  upsertDriver: (driver: Driver) => void;
  removeDriver: (id: string) => void;
}

export const useDriverStore = create<DriverState>()((set) => ({
  drivers: [],
  setDrivers: (drivers) => set({ drivers }),
  upsertDriver: (driver) =>
    set((s) => ({
      drivers: s.drivers.some((d) => d.id === driver.id)
        ? s.drivers.map((d) => (d.id === driver.id ? driver : d))
        : [...s.drivers, driver],
    })),
  removeDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),
}));
