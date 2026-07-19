import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();
let accessToken: string;
let createdVehicleId: string;

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');
  await prisma.user.upsert({
    where: { email: 'test-vehicles@transitops.com' },
    update: { password: hash },
    create: {
      email: 'test-vehicles@transitops.com',
      name: 'Test Fleet V',
      role: 'fleet_manager',
      password: hash,
    },
  });

  const res = await request(app).post('/api/v1/auth/login').send({
    email: 'test-vehicles@transitops.com',
    password: 'Transit@123',
    role: 'fleet_manager',
  });
  accessToken = res.body.data.accessToken;
});

afterAll(async () => {
  if (createdVehicleId) {
    await prisma.vehicle.deleteMany({ where: { id: createdVehicleId } });
  }
  await prisma.vehicle.deleteMany({ where: { registrationNumber: { startsWith: 'VTEST-' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-vehicles' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/vehicles', () => {
  it('should create a vehicle with valid data', async () => {
    const reg = `VTEST-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        registrationNumber: reg,
        name: 'Test Van Alpha',
        type: 'van',
        maxLoadCapacity: 1200,
        odometer: 5000,
        acquisitionCost: 750000,
        region: 'North Zone',
        make: 'Tata',
        model: 'Ace Gold',
        year: 2023,
        color: 'White',
        fuelType: 'diesel',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('available');
    expect(res.body.data.registrationNumber).toBe(reg.toUpperCase());
    createdVehicleId = res.body.data.id;
  });

  it('should reject duplicate registration number', async () => {
    const reg = `VTEST-DUP-${Date.now()}`;
    const payload = {
      registrationNumber: reg, name: 'Dup 1', type: 'van',
      maxLoadCapacity: 1000, acquisitionCost: 0, region: 'North Zone',
      make: 'Tata', model: 'Ace', year: 2023, color: 'White', fuelType: 'diesel',
    };
    await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${accessToken}`).send(payload);
    const res = await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${accessToken}`).send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('should reject negative maxLoadCapacity', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        registrationNumber: `VTEST-NEG-${Date.now()}`, name: 'Bad Van', type: 'van',
        maxLoadCapacity: -100, acquisitionCost: 0, region: 'North Zone',
        make: 'Tata', model: 'Ace', year: 2023, color: 'White', fuelType: 'diesel',
      });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/vehicles', () => {
  it('should return paginated vehicle list', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles?page=1&pageSize=5')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.pageSize).toBe(5);
  });

  it('should filter by status=available', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles?status=available')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((v: { status: string }) => {
      expect(v.status).toBe('available');
    });
  });

  it('should search by name', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles?search=Test Van Alpha')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/vehicles');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/vehicles/:id', () => {
  it('should return vehicle by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/vehicles/${createdVehicleId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdVehicleId);
    expect(res.body.data.documents).toBeDefined();
  });

  it('should return 404 for unknown ID', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles/clnonsense000000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/vehicles/:id', () => {
  it('should update name and color', async () => {
    const res = await request(app)
      .put(`/api/v1/vehicles/${createdVehicleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Van Name', color: 'Blue' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Van Name');
    expect(res.body.data.color).toBe('Blue');
  });
});

describe('DELETE /api/v1/vehicles/:id', () => {
  it('should delete a vehicle', async () => {
    const createRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        registrationNumber: `VTEST-DEL-${Date.now()}`,
        name: 'To Be Deleted',
        type: 'mini',
        maxLoadCapacity: 300,
        acquisitionCost: 200000,
        region: 'South Zone',
        make: 'Mahindra',
        model: 'Supro',
        year: 2022,
        color: 'Black',
        fuelType: 'petrol',
      });

    const idToDelete = createRes.body.data.id;
    const res = await request(app)
      .delete(`/api/v1/vehicles/${idToDelete}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/deleted/i);
  });
});
