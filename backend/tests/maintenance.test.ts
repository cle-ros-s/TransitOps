import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();
let accessToken: string;
let vehicleId: string;
let maintenanceId: string;

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');
  await prisma.user.upsert({
    where: { email: 'test-maint@transitops.com' },
    update: { password: hash },
    create: {
      email: 'test-maint@transitops.com',
      name: 'Test Maint FM',
      role: 'fleet_manager',
      password: hash,
    },
  });

  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test-maint@transitops.com',
    password: 'Transit@123',
    role: 'fleet_manager',
  });
  accessToken = loginRes.body.data.accessToken;

  // Create a vehicle for maintenance testing
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: `MAINT-VH-${Date.now()}`,
      name: 'Maintenance Test Van',
      type: 'van',
      maxLoadCapacity: 1500,
      odometer: 20000,
      acquisitionCost: 600000,
      status: 'available',
      region: 'East Zone',
      make: 'Mahindra',
      model: 'Supro',
      year: 2022,
      color: 'Silver',
      fuelType: 'petrol',
    },
  });
  vehicleId = vehicle.id;
});

afterAll(async () => {
  // Ensure cleanup even on test failure
  if (vehicleId) {
    await prisma.maintenanceRecord.deleteMany({ where: { vehicleId } });
    await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
  }
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-maint' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/maintenance', () => {
  it('should schedule maintenance and set vehicle to in_shop', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vehicleId,
        serviceType: 'oil_change',
        description: 'Scheduled 15,000 km oil change and filter replacement',
        estimatedCost: 5000,
        scheduledDate: new Date().toISOString(),
        technician: 'Arun Kumar',
        workshopName: 'City Auto Workshop',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.vehicleId).toBe(vehicleId);
    maintenanceId = res.body.data.id;

    // Vehicle should now be in_shop
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe('in_shop');
  });

  it('should reject maintenance for vehicle already in_shop', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vehicleId,
        serviceType: 'brake_service',
        description: 'Second record while in shop — should be rejected',
        estimatedCost: 3000,
        scheduledDate: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('should reject negative estimated cost', async () => {
    const otherVehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: `MAINT-TMP-${Date.now()}`,
        name: 'Temp Van',
        type: 'van',
        maxLoadCapacity: 1000,
        acquisitionCost: 0,
        status: 'available',
        region: 'North Zone',
        make: 'Tata',
        model: 'Ace',
        year: 2023,
        color: 'White',
        fuelType: 'diesel',
      },
    });

    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vehicleId: otherVehicle.id,
        serviceType: 'inspection',
        description: 'Negative cost test',
        estimatedCost: -500,
        scheduledDate: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
    await prisma.vehicle.delete({ where: { id: otherVehicle.id } });
  });
});

describe('PATCH /api/v1/maintenance/:id/close', () => {
  it('should close maintenance and restore vehicle to available', async () => {
    const res = await request(app)
      .patch(`/api/v1/maintenance/${maintenanceId}/close`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actualCost: 4800 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.actualCost).toBe(4800);
    expect(res.body.data.completedDate).toBeDefined();

    // Vehicle should be available again
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe('available');
  });

  it('should reject closing an already-completed record', async () => {
    const res = await request(app)
      .patch(`/api/v1/maintenance/${maintenanceId}/close`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actualCost: 5000 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });
});

describe('GET /api/v1/maintenance', () => {
  it('should return paginated maintenance list', async () => {
    const res = await request(app)
      .get('/api/v1/maintenance?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('should filter by status=completed', async () => {
    const res = await request(app)
      .get('/api/v1/maintenance?status=completed')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((m: { status: string }) => {
      expect(m.status).toBe('completed');
    });
  });
});

describe('GET /api/v1/maintenance/:id', () => {
  it('should return maintenance record by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/maintenance/${maintenanceId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(maintenanceId);
    expect(res.body.data.vehicle).toBeDefined();
  });
});
