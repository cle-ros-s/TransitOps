import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();
let analystToken: string;
let fmToken: string;

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'test-analyst@transitops.com' },
      update: { password: hash },
      create: {
        email: 'test-analyst@transitops.com',
        name: 'Test Analyst',
        role: 'financial_analyst',
        password: hash,
      },
    }),
    prisma.user.upsert({
      where: { email: 'test-fmgr@transitops.com' },
      update: { password: hash },
      create: {
        email: 'test-fmgr@transitops.com',
        name: 'Test FM Analytics',
        role: 'fleet_manager',
        password: hash,
      },
    }),
  ]);

  const [analystRes, fmRes] = await Promise.all([
    request(app).post('/api/v1/auth/login').send({
      email: 'test-analyst@transitops.com',
      password: 'Transit@123',
      role: 'financial_analyst',
    }),
    request(app).post('/api/v1/auth/login').send({
      email: 'test-fmgr@transitops.com',
      password: 'Transit@123',
      role: 'fleet_manager',
    }),
  ]);

  analystToken = analystRes.body.data.accessToken;
  fmToken = fmRes.body.data.accessToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: ['test-analyst@transitops.com', 'test-fmgr@transitops.com'] } },
  });
  await prisma.$disconnect();
});

describe('GET /api/v1/analytics/monthly-trends', () => {
  it('should return monthly trend array for 3 months', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends?months=3')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toHaveProperty('month');
    expect(res.body.data[0]).toHaveProperty('trips');
    expect(res.body.data[0]).toHaveProperty('revenue');
    expect(res.body.data[0]).toHaveProperty('fuel');
    expect(res.body.data[0]).toHaveProperty('expenses');
  });

  it('should default to 6 months', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-trends')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(6);
  });
});

describe('GET /api/v1/analytics/vehicle-performance', () => {
  it('should return vehicle performance metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/vehicle-performance')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('vehicleId');
      expect(res.body.data[0]).toHaveProperty('totalTrips');
      expect(res.body.data[0]).toHaveProperty('totalRevenue');
      expect(res.body.data[0]).toHaveProperty('roi');
    }
  });
});

describe('GET /api/v1/analytics/driver-performance', () => {
  it('should return driver performance metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/driver-performance')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('safetyScore');
      expect(res.body.data[0]).toHaveProperty('tripCompletionRate');
    }
  });
});

describe('GET /api/v1/analytics/top-costly-vehicles', () => {
  it('should return top costly vehicles sorted by cost', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/top-costly-vehicles?limit=5')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    if (res.body.data.length >= 2) {
      expect(res.body.data[0].totalCost).toBeGreaterThanOrEqual(res.body.data[1].totalCost);
    }
  });
});

describe('GET /api/v1/analytics/monthly-fuel', () => {
  it('should return monthly fuel data', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-fuel?months=3')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toHaveProperty('totalLiters');
    expect(res.body.data[0]).toHaveProperty('totalCost');
    expect(res.body.data[0]).toHaveProperty('avgCostPerLiter');
  });
});

describe('GET /api/v1/analytics/monthly-expenses', () => {
  it('should return monthly expense breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-expenses?months=3')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toHaveProperty('toll');
    expect(res.body.data[0]).toHaveProperty('other');
    expect(res.body.data[0]).toHaveProperty('total');
  });
});

describe('GET /api/v1/analytics/maintenance-costs', () => {
  it('should return maintenance costs grouped by service type', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/maintenance-costs')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/analytics/export/csv', () => {
  it('should return CSV file', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/export/csv')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});

describe('GET /api/v1/dashboard/stats', () => {
  it('should return complete dashboard KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vehicles).toBeDefined();
    expect(res.body.data.drivers).toBeDefined();
    expect(res.body.data.trips).toBeDefined();
    expect(res.body.data.maintenance).toBeDefined();
    expect(res.body.data.financials).toBeDefined();
    expect(res.body.data.alerts).toBeDefined();
    expect(typeof res.body.data.fleetUtilization).toBe('number');
  });
});

describe('GET /api/v1/dashboard/fleet-health', () => {
  it('should return fleet health data', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/fleet-health')
      .set('Authorization', `Bearer ${fmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.expiringLicenses).toBeDefined();
    expect(res.body.data.activeMaintenance).toBeDefined();
    expect(Array.isArray(res.body.data.expiringLicenses)).toBe(true);
    expect(Array.isArray(res.body.data.activeMaintenance)).toBe(true);
  });
});
