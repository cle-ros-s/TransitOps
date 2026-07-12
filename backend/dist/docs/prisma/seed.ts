import { PrismaClient, Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'fleetmanager@transitops.in' }, update: {}, create: { name: 'Fleet Manager', email: 'fleetmanager@transitops.in', role: Role.FLEET_MANAGER, passwordHash } }),
    prisma.user.upsert({ where: { email: 'dispatcher@transitops.in' }, update: {}, create: { name: 'Dispatcher', email: 'dispatcher@transitops.in', role: Role.DISPATCHER, passwordHash } }),
    prisma.user.upsert({ where: { email: 'safety@transitops.in' }, update: {}, create: { name: 'Safety Officer', email: 'safety@transitops.in', role: Role.SAFETY_OFFICER, passwordHash } }),
    prisma.user.upsert({ where: { email: 'finance@transitops.in' }, update: {}, create: { name: 'Financial Analyst', email: 'finance@transitops.in', role: Role.FINANCIAL_ANALYST, passwordHash } }),
  ]);
  console.log(`Created ${users.length} users.`);

  // 2. Vehicles
  const v1 = await prisma.vehicle.upsert({ where: { regNo: 'VAN-05' }, update: {}, create: { regNo: 'VAN-05', name: 'Delivery Van', type: 'Van', maxLoadCapacityKg: 500, acquisitionCost: 150000, revenue: 5000, status: VehicleStatus.AVAILABLE } });
  const v2 = await prisma.vehicle.upsert({ where: { regNo: 'TRUCK-11' }, update: {}, create: { regNo: 'TRUCK-11', name: 'Heavy Truck', type: 'Truck', maxLoadCapacityKg: 5000, acquisitionCost: 800000, revenue: 20000, status: VehicleStatus.ON_TRIP } });
  const v3 = await prisma.vehicle.upsert({ where: { regNo: 'MINI-03' }, update: {}, create: { regNo: 'MINI-03', name: 'Mini Truck', type: 'Mini', maxLoadCapacityKg: 1000, acquisitionCost: 250000, revenue: 1000, status: VehicleStatus.IN_SHOP } });
  const v4 = await prisma.vehicle.upsert({ where: { regNo: 'VAN-09' }, update: {}, create: { regNo: 'VAN-09', name: 'Old Van', type: 'Van', maxLoadCapacityKg: 750, acquisitionCost: 120000, revenue: 0, status: VehicleStatus.RETIRED } });

  // 3. Drivers
  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
  const lastYear = new Date(); lastYear.setFullYear(lastYear.getFullYear() - 1);
  const d1 = await prisma.driver.upsert({ where: { licenseNumber: 'LIC-ALEX' }, update: {}, create: { name: 'Alex', licenseNumber: 'LIC-ALEX', licenseCategory: 'LMV', licenseExpiry: nextYear, contact: '1234567890', status: DriverStatus.AVAILABLE } });
  const d2 = await prisma.driver.upsert({ where: { licenseNumber: 'LIC-JOHN' }, update: {}, create: { name: 'John', licenseNumber: 'LIC-JOHN', licenseCategory: 'HMV', licenseExpiry: lastYear, contact: '2345678901', status: DriverStatus.SUSPENDED } });
  const d3 = await prisma.driver.upsert({ where: { licenseNumber: 'LIC-PRIYA' }, update: {}, create: { name: 'Priya', licenseNumber: 'LIC-PRIYA', licenseCategory: 'LMV', licenseExpiry: nextYear, contact: '3456789012', status: DriverStatus.ON_TRIP } });
  const d4 = await prisma.driver.upsert({ where: { licenseNumber: 'LIC-SURESH' }, update: {}, create: { name: 'Suresh', licenseNumber: 'LIC-SURESH', licenseCategory: 'HMV', licenseExpiry: nextYear, contact: '4567890123', status: DriverStatus.OFF_DUTY } });

  // 4. Settings
  await prisma.settings.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton', depotName: 'Demo Depot', currency: 'INR', distanceUnit: 'km', ratePerKm: 10 } });

  // 5. Maintenance
  await prisma.maintenanceRecord.create({ data: { vehicleId: v3.id, serviceType: 'Engine Repair', cost: 1500, date: new Date(), status: MaintenanceStatus.ACTIVE } });
  await prisma.maintenanceRecord.create({ data: { vehicleId: v2.id, serviceType: 'Oil Change', cost: 300, date: new Date(Date.now() - 86400000 * 5), status: MaintenanceStatus.COMPLETED } });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
