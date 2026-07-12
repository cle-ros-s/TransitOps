import { create } from 'zustand';
import type { MaintenanceRecord } from '../types';

interface MaintenanceState {
  records: MaintenanceRecord[];
  setRecords: (records: MaintenanceRecord[]) => void;
  upsertRecord: (record: MaintenanceRecord) => void;
  removeRecord: (id: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>()((set) => ({
  records: [],
  setRecords: (records) => set({ records }),
  upsertRecord: (record) =>
    set((s) => ({
      records: s.records.some((r) => r.id === record.id)
        ? s.records.map((r) => (r.id === record.id ? record : r))
        : [...s.records, record],
    })),
  removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
}));
