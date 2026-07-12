import { DB_KEY } from '../config/constants';
import type { Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from '../types';
import {
  SEED_VEHICLES, SEED_DRIVERS, SEED_TRIPS,
  SEED_MAINTENANCE, SEED_FUEL_LOGS, SEED_EXPENSES, SEED_USERS
} from './seedData';

export interface AppDB {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  users: typeof SEED_USERS;
  seeded: boolean;
}

function getDefaultDB(): AppDB {
  return {
    vehicles: [...SEED_VEHICLES],
    drivers: [...SEED_DRIVERS],
    trips: [...SEED_TRIPS],
    maintenance: [...SEED_MAINTENANCE],
    fuelLogs: [...SEED_FUEL_LOGS],
    expenses: [...SEED_EXPENSES],
    users: [...SEED_USERS],
    seeded: true,
  };
}

function loadDB(): AppDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return getDefaultDB();
    const parsed = JSON.parse(raw) as AppDB;
    if (!parsed.seeded) return getDefaultDB();
    return parsed;
  } catch {
    return getDefaultDB();
  }
}

function saveDB(db: AppDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _db: AppDB = loadDB();

export const db = {
  get(): AppDB { return _db; },
  save(): void { saveDB(_db); },
  reset(): void { _db = getDefaultDB(); saveDB(_db); },
  delay,
};
