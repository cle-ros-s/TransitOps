import { create } from 'zustand';
import type { FuelLog, Expense } from '../types';

interface FuelExpenseState {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  setFuelLogs: (logs: FuelLog[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  addFuelLog: (log: FuelLog) => void;
  addExpense: (expense: Expense) => void;
  removeFuelLog: (id: string) => void;
  removeExpense: (id: string) => void;
}

export const useFuelExpenseStore = create<FuelExpenseState>()((set) => ({
  fuelLogs: [],
  expenses: [],
  setFuelLogs: (fuelLogs) => set({ fuelLogs }),
  setExpenses: (expenses) => set({ expenses }),
  addFuelLog: (log) => set((s) => ({ fuelLogs: [...s.fuelLogs, log] })),
  addExpense: (expense) => set((s) => ({ expenses: [...s.expenses, expense] })),
  removeFuelLog: (id) => set((s) => ({ fuelLogs: s.fuelLogs.filter((f) => f.id !== id) })),
  removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
}));
