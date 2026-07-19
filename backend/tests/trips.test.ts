import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();
let dispatcherToken: string;
let vehicleId: string;
let driverId: string;
let tripId: string;

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');

  await prisma.user.upsert({
    where: { email: 'test-trips-dispatch@transitops.com' },
    update: { password: hash },
    create: {
      email: 'test-trips-dispatch@transitops.com',
      name: 'Test Dispatcher',
      role: 'dispatcher',
      password: hash,
    },
  });

  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test-trips-dispatch@transitops.com',
    password: 'Transit@123',
    role: 'dispatcher',
  });
  dispatcherToken = loginRes.body.data.accessToken;

  // Seed test vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: `TRIP-VH-${Date.now()}`,
      name: 'Trip Test Van',
      type: 'van',
      maxLoadCapacity: 2000,
      odometer: 10000,
      acquisitionCost: 500000,
      status: 'available',
      region: 'North Zone',
      make: 'Tata',
      model: 'Ace',
      year: 2022,
      color: 'White',
      fuelType: 'diesel',
    },
  });
  vehicleId = vehicle.id;

  // Seed test driver
  const driver = await prisma.driver.create({
    data: {
      name: 'Trip Test Driver',
      licenseNumber: `TRP-LIC-${Date.now()}`,
      licenseCategory: 'C',
      licenseExpiryDate: new Date('2028-01-01'),
      contactNumber: '9000000001',
      email: `tripdriver-${Date.now()}@test.com`,
      status: 'available',
      address: 'Test Address, Mumbai',
      joinDate: new Date('2022-06-01'),
    },
  });
  driverId = driver.id;
});

afterAll(async () => {
  // Cleanup in dependency order
  if (tripId) {
    await prisma.fuelLog.deleteMany({ where: { tripId } });
    await prisma.expense.deleteMany({ where: { tripId } });
    await prisma.trip.deleteMany({ where: { id: tripId } });
  }
  if (vehicleId) await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
  if (driverId) await prisma.driver.deleteMany({ where: { id: driverId } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-trips' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/trips — Create', () => {
  it('should create a trip in draft state', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        vehicleId,
        driverId,
        source: 'Mumbai',
        destination: 'Pune',
        cargoWeight: 500,
        plannedDistance: 148,
        revenue: 35000,
        startDate: new Date().toISOString(),
        notes: 'Integration test trip',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.tripNumber).toMatch(/^TR-/);
    expect(res.body.data.vehicleId).toBe(vehicleId);
    tripId = res.body.data.id;
  });

  it('should reject same source and destination', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        vehicleId,
        driverId,
        source: 'Mumbai',
        destination: 'Mumbai',
        cargoWeight: 100,
        plannedDistance: 10,
        startDate: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'destination' }),
      ]),
    );
  });

  it('should reject cargo weight exceeding vehicle capacity', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        vehicleId,
        driverId,
        source: 'Delhi',
        destination: 'Agra',
        cargoWeight: 99999,
        plannedDistance: 200,
        startDate: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('should reject zero planned distance', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        vehicleId,
        driverId,
        source: 'Delhi',
        destination: 'Agra',
        cargoWeight: 100,
        plannedDistance: 0,
        startDate: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/v1/trips/:id/dispatch', () => {
  it('should dispatch a draft trip — sets vehicle/driver to on_trip', async () => {
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/dispatch`)
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('dispatched');

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);
    expect(vehicle?.status).toBe('on_trip');
    expect(driver?.status).toBe('on_trip');
  });

  it('should reject dispatching an already-dispatched trip', async () => {
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/dispatch`)
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });
});

describe('PATCH /api/v1/trips/:id/complete', () => {
  it('should complete a dispatched trip and auto-create fuel log + expense', async () => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const currentOdometer = vehicle!.odometer;

    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        finalOdometer: currentOdometer + 200,
        fuelConsumed: 30,
        toll: 300,
        otherExpenses: 150,
        actualDistance: 198,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.fuelConsumed).toBe(30);

    // Verify vehicle restored
    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(updatedVehicle?.status).toBe('available');
    expect(updatedVehicle?.odometer).toBe(currentOdometer + 200);

    // Verify driver restored
    const updatedDriver = await prisma.driver.findUnique({ where: { id: driverId } });
    expect(updatedDriver?.status).toBe('available');
    expect(updatedDriver?.totalTrips).toBeGreaterThanOrEqual(1);

    // Verify auto-created fuel log
    const fuelLog = await prisma.fuelLog.findFirst({ where: { tripId } });
    expect(fuelLog).not.toBeNull();
    expect(fuelLog?.liters).toBe(30);
    expect(fuelLog?.totalCost).toBeGreaterThan(0);

    // Verify auto-created expense
    const expense = await prisma.expense.findFirst({ where: { tripId } });
    expect(expense).not.toBeNull();
    expect(expense?.toll).toBe(300);
    expect(expense?.otherExpenses).toBe(150);
  });

  it('should reject completing an already-completed trip', async () => {
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ finalOdometer: 99999, fuelConsumed: 10 });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/trips', () => {
  it('should list trips with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/trips?page=1&pageSize=5')
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 5,
    });
  });

  it('should filter trips by status=completed', async () => {
    const res = await request(app)
      .get('/api/v1/trips?status=completed')
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((t: { status: string }) => {
      expect(t.status).toBe('completed');
    });
  });
});
