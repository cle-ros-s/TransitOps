import type { Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense } from '../types';

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'v1', registrationNumber: 'VAN-05', name: 'City Sprinter',
    type: 'van', maxLoadCapacity: 1500, odometer: 45230, acquisitionCost: 850000,
    revenue: 1200000, status: 'available', region: 'North Zone',
    make: 'Tata', model: 'Ace', year: 2021, color: 'White',
    fuelType: 'diesel',
    documents: [
      { id: 'd1', type: 'insurance', name: 'Insurance Policy', expiryDate: '2025-12-31', uploadedAt: '2024-01-01' },
      { id: 'd2', type: 'registration', name: 'RC Book', expiryDate: '2026-06-30', uploadedAt: '2024-01-01' },
      { id: 'd3', type: 'permit', name: 'Transport Permit', expiryDate: '2025-03-15', uploadedAt: '2024-01-01' },
      { id: 'd4', type: 'pollution', name: 'PUC Certificate', expiryDate: '2025-09-30', uploadedAt: '2024-01-01' },
    ],
    createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'v2', registrationNumber: 'TRUCK-11', name: 'HeavyHauler Pro',
    type: 'truck', maxLoadCapacity: 10000, odometer: 128450, acquisitionCost: 3200000,
    revenue: 5800000, status: 'on_trip', region: 'South Zone',
    make: 'Ashok Leyland', model: 'Dost', year: 2020, color: 'Blue',
    fuelType: 'diesel',
    documents: [
      { id: 'd5', type: 'insurance', name: 'Insurance Policy', expiryDate: '2026-03-31', uploadedAt: '2024-01-01' },
      { id: 'd6', type: 'registration', name: 'RC Book', expiryDate: '2027-01-01', uploadedAt: '2024-01-01' },
      { id: 'd7', type: 'permit', name: 'Transport Permit', expiryDate: '2026-05-20', uploadedAt: '2024-01-01' },
      { id: 'd8', type: 'pollution', name: 'PUC Certificate', expiryDate: '2026-01-15', uploadedAt: '2024-01-01' },
    ],
    createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'v3', registrationNumber: 'MINI-03', name: 'QuickExpress',
    type: 'mini', maxLoadCapacity: 500, odometer: 22100, acquisitionCost: 450000,
    revenue: 620000, status: 'in_shop', region: 'East Zone',
    make: 'Mahindra', model: 'Supro', year: 2022, color: 'Silver',
    fuelType: 'petrol',
    documents: [
      { id: 'd9', type: 'insurance', name: 'Insurance Policy', expiryDate: '2025-08-15', uploadedAt: '2024-01-01' },
      { id: 'd10', type: 'registration', name: 'RC Book', expiryDate: '2025-12-31', uploadedAt: '2024-01-01' },
      { id: 'd11', type: 'permit', name: 'Transport Permit', expiryDate: '2025-06-01', uploadedAt: '2024-01-01' },
      { id: 'd12', type: 'pollution', name: 'PUC Certificate', expiryDate: '2025-04-30', uploadedAt: '2024-01-01' },
    ],
    createdAt: '2024-03-10T10:00:00Z', updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'v4', registrationNumber: 'VAN-09', name: 'Metro Van',
    type: 'van', maxLoadCapacity: 1200, odometer: 67800, acquisitionCost: 780000,
    revenue: 980000, status: 'available', region: 'West Zone',
    make: 'Force Motors', model: 'Traveller', year: 2021, color: 'Red',
    fuelType: 'cng',
    documents: [
      { id: 'd13', type: 'insurance', name: 'Insurance Policy', expiryDate: '2026-07-31', uploadedAt: '2024-01-01' },
      { id: 'd14', type: 'registration', name: 'RC Book', expiryDate: '2026-09-30', uploadedAt: '2024-01-01' },
      { id: 'd15', type: 'permit', name: 'Transport Permit', expiryDate: '2026-02-28', uploadedAt: '2024-01-01' },
      { id: 'd16', type: 'pollution', name: 'PUC Certificate', expiryDate: '2025-11-30', uploadedAt: '2024-01-01' },
    ],
    createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'v5', registrationNumber: 'TRUCK-07', name: 'BulkMaster',
    type: 'truck', maxLoadCapacity: 15000, odometer: 235600, acquisitionCost: 4500000,
    revenue: 9200000, status: 'available', region: 'Central',
    make: 'Eicher', model: 'Pro 6025', year: 2019, color: 'Yellow',
    fuelType: 'diesel',
    documents: [
      { id: 'd17', type: 'insurance', name: 'Insurance Policy', expiryDate: '2025-10-31', uploadedAt: '2024-01-01' },
      { id: 'd18', type: 'registration', name: 'RC Book', expiryDate: '2026-04-30', uploadedAt: '2024-01-01' },
      { id: 'd19', type: 'permit', name: 'Transport Permit', expiryDate: '2025-12-15', uploadedAt: '2024-01-01' },
      { id: 'd20', type: 'pollution', name: 'PUC Certificate', expiryDate: '2025-07-31', uploadedAt: '2024-01-01' },
    ],
    createdAt: '2023-06-01T10:00:00Z', updatedAt: '2023-06-01T10:00:00Z',
  },
  {
    id: 'v6', registrationNumber: 'BUS-02', name: 'StaffShuttle',
    type: 'bus', maxLoadCapacity: 0, odometer: 89000, acquisitionCost: 2800000,
    revenue: 3400000, status: 'retired', region: 'South Zone',
    make: 'Volvo', model: 'B7R', year: 2017, color: 'Orange',
    fuelType: 'diesel',
    documents: [],
    createdAt: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T10:00:00Z',
  },
];

export const SEED_DRIVERS: Driver[] = [
  {
    id: 'dr1', name: 'Alex Kumar', licenseNumber: 'DL-2021-MH-45321',
    licenseCategory: 'C', licenseExpiryDate: '2026-08-15',
    contactNumber: '+91-9876543210', email: 'alex@transitops.com',
    safetyScore: 92, tripCompletionRate: 97,
    status: 'on_trip', address: '12, MG Road, Mumbai',
    joinDate: '2021-03-01', totalTrips: 243,
    createdAt: '2021-03-01T10:00:00Z', updatedAt: '2021-03-01T10:00:00Z',
  },
  {
    id: 'dr2', name: 'John Mathew', licenseNumber: 'DL-2019-KA-67890',
    licenseCategory: 'D', licenseExpiryDate: '2024-11-30',
    contactNumber: '+91-9765432109', email: 'john@transitops.com',
    safetyScore: 78, tripCompletionRate: 88,
    status: 'available', address: '45, Brigade Road, Bengaluru',
    joinDate: '2019-07-15', totalTrips: 412,
    createdAt: '2019-07-15T10:00:00Z', updatedAt: '2019-07-15T10:00:00Z',
  },
  {
    id: 'dr3', name: 'Priya Sharma', licenseNumber: 'DL-2022-DL-11223',
    licenseCategory: 'B', licenseExpiryDate: '2027-03-20',
    contactNumber: '+91-9654321098', email: 'priya@transitops.com',
    safetyScore: 95, tripCompletionRate: 99,
    status: 'available', address: '78, Connaught Place, Delhi',
    joinDate: '2022-01-10', totalTrips: 156,
    createdAt: '2022-01-10T10:00:00Z', updatedAt: '2022-01-10T10:00:00Z',
  },
  {
    id: 'dr4', name: 'Suresh Nair', licenseNumber: 'DL-2018-KL-99887',
    licenseCategory: 'E', licenseExpiryDate: '2025-06-10',
    contactNumber: '+91-9543210987', email: 'suresh@transitops.com',
    safetyScore: 65, tripCompletionRate: 82,
    status: 'suspended', address: '23, MG Road, Kochi',
    joinDate: '2018-05-20', totalTrips: 589,
    createdAt: '2018-05-20T10:00:00Z', updatedAt: '2018-05-20T10:00:00Z',
  },
  {
    id: 'dr5', name: 'Ravi Patel', licenseNumber: 'DL-2020-GJ-33445',
    licenseCategory: 'C', licenseExpiryDate: '2026-12-01',
    contactNumber: '+91-9432109876', email: 'ravi@transitops.com',
    safetyScore: 85, tripCompletionRate: 93,
    status: 'available', address: '56, CG Road, Ahmedabad',
    joinDate: '2020-09-01', totalTrips: 301,
    createdAt: '2020-09-01T10:00:00Z', updatedAt: '2020-09-01T10:00:00Z',
  },
];

export const SEED_TRIPS: Trip[] = [
  {
    id: 'tr1', tripNumber: 'TR001',
    source: 'Mumbai', destination: 'Pune',
    vehicleId: 'v2', driverId: 'dr1',
    cargoWeight: 8500, plannedDistance: 149,
    revenue: 45000, status: 'dispatched',
    startDate: '2024-07-10T08:00:00Z',
    notes: 'Fragile electronics cargo',
    createdAt: '2024-07-10T07:00:00Z', updatedAt: '2024-07-10T08:00:00Z',
  },
  {
    id: 'tr2', tripNumber: 'TR002',
    source: 'Delhi', destination: 'Jaipur',
    vehicleId: 'v5', driverId: 'dr3',
    cargoWeight: 12000, plannedDistance: 282,
    revenue: 78000, status: 'completed',
    startDate: '2024-07-05T06:00:00Z',
    endDate: '2024-07-06T14:00:00Z',
    actualDistance: 290, fuelConsumed: 87,
    finalOdometer: 235890,
    createdAt: '2024-07-05T05:00:00Z', updatedAt: '2024-07-06T14:00:00Z',
  },
  {
    id: 'tr3', tripNumber: 'TR003',
    source: 'Bengaluru', destination: 'Chennai',
    vehicleId: 'v4', driverId: 'dr5',
    cargoWeight: 900, plannedDistance: 346,
    revenue: 32000, status: 'draft',
    startDate: '2024-07-15T09:00:00Z',
    createdAt: '2024-07-11T10:00:00Z', updatedAt: '2024-07-11T10:00:00Z',
  },
  {
    id: 'tr4', tripNumber: 'TR004',
    source: 'Hyderabad', destination: 'Vizag',
    vehicleId: 'v1', driverId: 'dr2',
    cargoWeight: 1100, plannedDistance: 625,
    revenue: 55000, status: 'cancelled',
    startDate: '2024-07-08T07:00:00Z',
    cancellationReason: 'Customer order cancelled due to force majeure',
    createdAt: '2024-07-08T06:00:00Z', updatedAt: '2024-07-09T10:00:00Z',
  },
];

export const SEED_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'm1', vehicleId: 'v3',
    serviceType: 'engine_repair', description: 'Engine overhaul due to excessive oil consumption',
    estimatedCost: 45000, actualCost: 48500,
    scheduledDate: '2024-07-08T09:00:00Z',
    status: 'active',
    technician: 'Ramesh Auto Works', workshopName: 'City Auto Workshop',
    createdAt: '2024-07-08T09:00:00Z', updatedAt: '2024-07-08T09:00:00Z',
  },
  {
    id: 'm2', vehicleId: 'v5',
    serviceType: 'tire_replacement', description: 'All 6 tires replaced - heavy wear',
    estimatedCost: 72000, actualCost: 75000,
    scheduledDate: '2024-06-15T10:00:00Z',
    completedDate: '2024-06-16T18:00:00Z',
    status: 'completed',
    technician: 'Suresh Tyres', workshopName: 'National Tyre Centre',
    createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-16T18:00:00Z',
  },
  {
    id: 'm3', vehicleId: 'v2',
    serviceType: 'oil_change', description: 'Routine oil & filter change at 128000 km',
    estimatedCost: 4500,
    scheduledDate: '2024-07-20T08:00:00Z',
    status: 'active',
    workshopName: 'Ashok Leyland Service Centre',
    createdAt: '2024-07-01T10:00:00Z', updatedAt: '2024-07-01T10:00:00Z',
  },
];

export const SEED_FUEL_LOGS: FuelLog[] = [
  {
    id: 'fl1', vehicleId: 'v2', tripId: 'tr1',
    date: '2024-07-10T08:00:00Z', liters: 65, costPerLiter: 92,
    totalCost: 5980, odometer: 128000,
    fuelStation: 'HP Petrol Pump, Thane',
    createdAt: '2024-07-10T08:00:00Z',
  },
  {
    id: 'fl2', vehicleId: 'v5', tripId: 'tr2',
    date: '2024-07-05T06:00:00Z', liters: 87, costPerLiter: 91.5,
    totalCost: 7960.5, odometer: 235600,
    fuelStation: 'BPCL Pump, NH-48',
    createdAt: '2024-07-05T06:00:00Z',
  },
  {
    id: 'fl3', vehicleId: 'v1',
    date: '2024-07-01T09:00:00Z', liters: 40, costPerLiter: 91,
    totalCost: 3640, odometer: 45000,
    fuelStation: 'Indian Oil, Andheri',
    createdAt: '2024-07-01T09:00:00Z',
  },
  {
    id: 'fl4', vehicleId: 'v4',
    date: '2024-07-03T07:00:00Z', liters: 55, costPerLiter: 87,
    totalCost: 4785, odometer: 67500,
    fuelStation: 'Nayara Energy, Bandra',
    createdAt: '2024-07-03T07:00:00Z',
  },
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'ex1', tripId: 'tr2', vehicleId: 'v5',
    date: '2024-07-06T14:00:00Z',
    toll: 2400, otherExpenses: 800, maintenanceCost: 0,
    totalCost: 3200,
    description: 'Highway tolls Delhi-Jaipur + driver meal allowance',
    createdAt: '2024-07-06T14:00:00Z',
  },
  {
    id: 'ex2', tripId: 'tr1', vehicleId: 'v2',
    date: '2024-07-10T08:00:00Z',
    toll: 650, otherExpenses: 300, maintenanceCost: 0,
    totalCost: 950,
    description: 'Mumbai-Pune expressway toll',
    createdAt: '2024-07-10T08:00:00Z',
  },
];

export const SEED_USERS = [
  {
    id: 'u1', name: 'Rajesh Menon', email: 'fleet@transitops.com',
    role: 'fleet_manager' as const, department: 'Fleet Operations',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2', name: 'Anita Singh', email: 'dispatch@transitops.com',
    role: 'dispatcher' as const, department: 'Dispatch Center',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u3', name: 'Kiran Bhat', email: 'safety@transitops.com',
    role: 'safety_officer' as const, department: 'Safety & Compliance',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u4', name: 'Meera Iyer', email: 'finance@transitops.com',
    role: 'financial_analyst' as const, department: 'Finance',
    createdAt: '2024-01-01T00:00:00Z',
  },
];
