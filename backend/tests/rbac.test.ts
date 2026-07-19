import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();
const tokens: Record<string, string> = {};

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');

  const roles = [
    'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst',
  ] as const;

  for (const role of roles) {
    await prisma.user.upsert({
      where: { email: `rbac-${role}@test.transitops.com` },
      update: { password: hash },
      create: {
        email: `rbac-${role}@test.transitops.com`,
        name: `RBAC ${role}`,
        role,
        password: hash,
      },
    });
    const res = await request(app).post('/api/v1/auth/login').send({
      email: `rbac-${role}@test.transitops.com`,
      password: 'Transit@123',
      role,
    });
    tokens[role] = res.body.data.accessToken;
  }
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'rbac-' } } });
  await prisma.$disconnect();
});

// ── Vehicle RBAC ─────────────────────────────────────────────────────────────
describe('RBAC — Vehicle Management', () => {
  it('fleet_manager can create vehicles (vehicles:write)', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens['fleet_manager']}`)
      .send({
        registrationNumber: `RBAC-FM-${Date.now()}`, name: 'RBAC FM Van',
        type: 'van', maxLoadCapacity: 1000, acquisitionCost: 0,
        region: 'North Zone', make: 'Tata', model: 'Ace', year: 2023,
        color: 'White', fuelType: 'diesel',
      });
    if (res.body.data?.id) await prisma.vehicle.delete({ where: { id: res.body.data.id } });
    expect(res.status).toBe(201);
  });

  it('dispatcher cannot create vehicles (no vehicles:write)', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens['dispatcher']}`)
      .send({
        registrationNumber: `RBAC-DIS-${Date.now()}`, name: 'Should Fail',
        type: 'van', maxLoadCapacity: 1000, acquisitionCost: 0,
        region: 'North Zone', make: 'Tata', model: 'Ace', year: 2023,
        color: 'White', fuelType: 'diesel',
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('safety_officer can read vehicles', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens['safety_officer']}`);
    expect(res.status).toBe(200);
  });

  it('financial_analyst can read vehicles', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens['financial_analyst']}`);
    expect(res.status).toBe(200);
  });
});

// ── Driver RBAC ───────────────────────────────────────────────────────────────
describe('RBAC — Driver Management', () => {
  it('fleet_manager can read drivers', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${tokens['fleet_manager']}`);
    expect(res.status).toBe(200);
  });

  it('dispatcher can read drivers (has drivers:read)', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${tokens['dispatcher']}`);
    // Dispatcher has drivers:read per RBAC matrix
    expect(res.status).toBe(200);
  });

  it('safety_officer can read drivers', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${tokens['safety_officer']}`);
    expect(res.status).toBe(200);
  });

  it('financial_analyst cannot read drivers (no drivers:read)', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${tokens['financial_analyst']}`);
    expect(res.status).toBe(403);
  });

  it('dispatcher cannot create drivers (no drivers:write)', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${tokens['dispatcher']}`)
      .send({
        name: 'Should Fail Driver',
        licenseNumber: `RBAC-DL-${Date.now()}`,
        licenseCategory: 'B',
        licenseExpiryDate: '2028-01-01',
        contactNumber: '9000000000',
        email: `rbac-driver-${Date.now()}@test.com`,
        address: 'Test Address',
        joinDate: new Date().toISOString(),
      });
    expect(res.status).toBe(403);
  });
});

// ── Analytics RBAC ────────────────────────────────────────────────────────────
describe('RBAC — Analytics', () => {
  it('fleet_manager can access analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends')
      .set('Authorization', `Bearer ${tokens['fleet_manager']}`);
    expect(res.status).toBe(200);
  });

  it('financial_analyst can access analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends')
      .set('Authorization', `Bearer ${tokens['financial_analyst']}`);
    expect(res.status).toBe(200);
  });

  it('dispatcher cannot access analytics (no analytics:read)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends')
      .set('Authorization', `Bearer ${tokens['dispatcher']}`);
    expect(res.status).toBe(403);
  });

  it('safety_officer cannot access analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends')
      .set('Authorization', `Bearer ${tokens['safety_officer']}`);
    expect(res.status).toBe(403);
  });
});

// ── Maintenance RBAC ──────────────────────────────────────────────────────────
describe('RBAC — Maintenance', () => {
  it('safety_officer can read maintenance', async () => {
    const res = await request(app)
      .get('/api/v1/maintenance')
      .set('Authorization', `Bearer ${tokens['safety_officer']}`);
    expect(res.status).toBe(200);
  });

  it('financial_analyst cannot create maintenance (no maintenance:write)', async () => {
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'available' } });
    if (!vehicle) return;

    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${tokens['financial_analyst']}`)
      .send({
        vehicleId: vehicle.id,
        serviceType: 'oil_change',
        description: 'Test',
        estimatedCost: 5000,
        scheduledDate: new Date().toISOString(),
      });
    expect(res.status).toBe(403);
  });
});

// ── Fuel RBAC ─────────────────────────────────────────────────────────────────
describe('RBAC — Fuel Logs', () => {
  it('financial_analyst can read fuel logs', async () => {
    const res = await request(app)
      .get('/api/v1/fuel-logs')
      .set('Authorization', `Bearer ${tokens['financial_analyst']}`);
    expect(res.status).toBe(200);
  });

  it('safety_officer cannot read fuel logs', async () => {
    const res = await request(app)
      .get('/api/v1/fuel-logs')
      .set('Authorization', `Bearer ${tokens['safety_officer']}`);
    expect(res.status).toBe(403);
  });
});

// ── Dashboard RBAC ────────────────────────────────────────────────────────────
describe('RBAC — Dashboard', () => {
  it('all roles can access dashboard', async () => {
    for (const role of ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']) {
      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${tokens[role]}`);
      expect(res.status).toBe(200);
    }
  });
});
