import { create } from 'zustand';
import type { Trip } from '../types';

interface TripState {
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  upsertTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
}

export const useTripStore = create<TripState>()((set) => ({
  trips: [],
  setTrips: (trips) => set({ trips }),
  upsertTrip: (trip) =>
    set((s) => ({
      trips: s.trips.some((t) => t.id === trip.id)
        ? s.trips.map((t) => (t.id === trip.id ? trip : t))
        : [...s.trips, trip],
    })),
  removeTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
}));
