/**
 * db.ts — compatibility shim.
 * The real database is now PostgreSQL (via backend API).
 * This file is kept to avoid import errors in any remaining code that
 * references the old in-memory db. All functional code has been migrated
 * to the real API clients.
 */

export const db = {
  get: () => ({
    vehicles: [],
    drivers: [],
    trips: [],
    maintenance: [],
    fuelLogs: [],
    expenses: [],
    users: [],
    seeded: true,
  }),
  save: () => {},
  reset: () => {},
  delay: (ms = 0): Promise<void> => new Promise((r) => setTimeout(r, ms)),
};
