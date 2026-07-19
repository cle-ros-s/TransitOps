import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TransitOps database...');

  // Hash per-user passwords to match frontend mock credentials
  const [fleetHash, dispatchHash, safetyHash, financeHash] = await Promise.all([
    bcrypt.hash('fleet123', 12),
    bcrypt.hash('dispatch123', 12),
    bcrypt.hash('safety123', 12),
    bcrypt.hash('finance123', 12),
  ]);

  const [fleetMgr, dispatcher, safetyOfficer, financeAnalyst] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'fleet@transitops.com' },
      update: { password: fleetHash },
      create: {
        email: 'fleet@transitops.com', name: 'Fleet Manager',
        role: 'fleet_manager', password: fleetHash, department: 'Fleet Operations',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dispatch@transitops.com' },
      update: { password: dispatchHash },
      create: {
        email: 'dispatch@transitops.com', name: 'Ravi Dispatcher',
        role: 'dispatcher', password: dispatchHash, department: 'Dispatch',
      },
    }),
    prisma.user.upsert({
      where: { email: 'safety@transitops.com' },
      update: { password: safetyHash },
      create: {
        email: 'safety@transitops.com', name: 'Safety Officer',
        role: 'safety_officer', password: safetyHash, department: 'Safety',
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@transitops.com' },
      update: { password: financeHash },
      create: {
        email: 'finance@transitops.com', name: 'Finance Analyst',
        role: 'financial_analyst', password: financeHash, department: 'Finance',
      },
    }),
  ]);

  console.log('✅ Users seeded:', [fleetMgr, dispatcher, safetyOfficer, financeAnalyst].map((u) => u.email));
  console.log('   Passwords: fleet123 / dispatch123 / safety123 / finance123');


  // ── Vehicles ─────────────────────────────────────────────────────────────────
  const v1 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'VAN-05' },
    update: {},
    create: {
      registrationNumber: 'VAN-05', name: 'City Sprinter',
      type: 'van', maxLoadCapacity: 1500, odometer: 45230,
      acquisitionCost: 850000, revenue: 1200000,
      status: 'available', region: 'North Zone',
      make: 'Tata', model: 'Ace', year: 2021, color: 'White', fuelType: 'diesel',
      documents: {
        create: [
          { type: 'insurance', name: 'Insurance Policy', expiryDate: new Date('2025-12-31') },
          { type: 'registration', name: 'RC Book', expiryDate: new Date('2026-06-30') },
          { type: 'permit', name: 'Transport Permit', expiryDate: new Date('2025-09-15') },
          { type: 'pollution', name: 'PUC Certificate', expiryDate: new Date('2025-09-30') },
        ],
      },
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'TRUCK-11' },
    update: {},
    create: {
      registrationNumber: 'TRUCK-11', name: 'HeavyHauler Pro',
      type: 'truck', maxLoadCapacity: 10000, odometer: 128450,
      acquisitionCost: 3200000, revenue: 5800000,
      status: 'available', region: 'South Zone',
      make: 'Ashok Leyland', model: 'Dost', year: 2020, color: 'Blue', fuelType: 'diesel',
      documents: {
        create: [
          { type: 'insurance', name: 'Insurance Policy', expiryDate: new Date('2026-03-31') },
          { type: 'registration', name: 'RC Book', expiryDate: new Date('2027-01-01') },
        ],
      },
    },
  });

  const v3 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'MINI-03' },
    update: {},
    create: {
      registrationNumber: 'MINI-03', name: 'QuickExpress',
      type: 'mini', maxLoadCapacity: 500, odometer: 22100,
      acquisitionCost: 450000, revenue: 620000,
      status: 'available', region: 'East Zone',
      make: 'Mahindra', model: 'Supro', year: 2022, color: 'Silver', fuelType: 'petrol',
      documents: { create: [{ type: 'insurance', name: 'Insurance', expiryDate: new Date('2025-08-15') }] },
    },
  });

  const v4 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'BUS-07' },
    update: {},
    create: {
      registrationNumber: 'BUS-07', name: 'MetroShuttle',
      type: 'bus', maxLoadCapacity: 3000, odometer: 89300,
      acquisitionCost: 2100000, revenue: 3400000,
      status: 'available', region: 'West Zone',
      make: 'VECV', model: 'Eicher', year: 2019, color: 'Red', fuelType: 'diesel',
      documents: { create: [{ type: 'registration', name: 'RC Book', expiryDate: new Date('2026-12-31') }] },
    },
  });

  console.log('✅ Vehicles seeded:', [v1, v2, v3, v4].map((v) => v.registrationNumber));

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const d1 = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-MH-123456' },
    update: {},
    create: {
      name: 'Rajesh Kumar', licenseNumber: 'DL-MH-123456',
      licenseCategory: 'C', licenseExpiryDate: new Date('2026-08-15'),
      contactNumber: '9876543210', email: 'rajesh.kumar@transitops.com',
      safetyScore: 92, tripCompletionRate: 98,
      status: 'available', address: '45 Andheri West, Mumbai',
      joinDate: new Date('2022-03-01'), totalTrips: 156,
    },
  });

  const d2 = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-KA-789012' },
    update: {},
    create: {
      name: 'Priya Sharma', licenseNumber: 'DL-KA-789012',
      licenseCategory: 'B', licenseExpiryDate: new Date('2025-08-10'),
      contactNumber: '9876543211', email: 'priya.sharma@transitops.com',
      safetyScore: 78, tripCompletionRate: 92,
      status: 'available', address: '12 Koramangala, Bangalore',
      joinDate: new Date('2023-01-15'), totalTrips: 88,
    },
  });

  const d3 = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-TN-345678' },
    update: {},
    create: {
      name: 'Vijay Mohan', licenseNumber: 'DL-TN-345678',
      licenseCategory: 'D', licenseExpiryDate: new Date('2027-02-28'),
      contactNumber: '9876543212', email: 'vijay.mohan@transitops.com',
      safetyScore: 88, tripCompletionRate: 95,
      status: 'available', address: '78 T Nagar, Chennai',
      joinDate: new Date('2021-07-10'), totalTrips: 224,
    },
  });

  console.log('✅ Drivers seeded:', [d1, d2, d3].map((d) => d.name));

  // ── Maintenance ───────────────────────────────────────────────────────────────
  const m1 = await prisma.maintenanceRecord.upsert({
    where: { id: 'seed-maint-001' },
    update: {},
    create: {
      id: 'seed-maint-001',
      vehicleId: v3.id, serviceType: 'oil_change',
      description: 'Scheduled 10,000 km oil change and filter replacement',
      estimatedCost: 4500, status: 'completed',
      scheduledDate: new Date('2024-11-01'), completedDate: new Date('2024-11-02'),
      actualCost: 4200, technician: 'Arun Mechanic', workshopName: 'City Auto Workshop',
    },
  });

  console.log('✅ Maintenance seeded');

  // ── Completed trip + fuel log + expense ─────────────────────────────────────
  const tripNumber = 'TR-SEED-001';
  const existingTrip = await prisma.trip.findUnique({ where: { tripNumber } });
  if (!existingTrip) {
    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        vehicleId: v1.id, driverId: d1.id,
        source: 'Mumbai', destination: 'Pune',
        cargoWeight: 800, plannedDistance: 148,
        actualDistance: 152, revenue: 45000,
        status: 'completed',
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-10'),
        fuelConsumed: 25, finalOdometer: 45382,
      },
    });

    await Promise.all([
      prisma.fuelLog.create({
        data: {
          vehicleId: v1.id, tripId: trip.id,
          date: new Date('2025-01-10'),
          liters: 25, costPerLiter: 91.5,
          totalCost: 2287.5, odometer: 45382,
          fuelStation: 'HP Petrol Pump, Khopoli',
        },
      }),
      prisma.expense.create({
        data: {
          tripId: trip.id, vehicleId: v1.id,
          date: new Date('2025-01-10'),
          toll: 350, otherExpenses: 200, maintenanceCost: 0,
          totalCost: 550,
          description: 'Mumbai–Pune expressway toll + loading charges',
        },
      }),
    ]);
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: fleetMgr.id,
      title: 'License Expiring Soon',
      message: `Driver Priya Sharma's license expires on 10 Aug 2025.`,
      type: 'warning',
      link: '/drivers',
    },
  });

  await prisma.notification.create({
    data: {
      userId: fleetMgr.id,
      title: 'Welcome to TransitOps',
      message: 'Your fleet management platform is ready. 4 vehicles and 3 drivers seeded.',
      type: 'success',
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n🔑 Demo login credentials (password: Transit@123):');
  console.log('  fleet@transitops.com      → Fleet Manager');
  console.log('  dispatch@transitops.com   → Dispatcher');
  console.log('  safety@transitops.com     → Safety Officer');
  console.log('  finance@transitops.com    → Financial Analyst');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
