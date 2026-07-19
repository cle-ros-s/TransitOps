import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prismaClient';
import { hashPassword } from '../src/utils/password';

const app = createApp();

beforeAll(async () => {
  await prisma.$connect();
  const hash = await hashPassword('Transit@123');
  await prisma.user.upsert({
    where: { email: 'test-auth@transitops.com' },
    update: { password: hash },
    create: {
      email: 'test-auth@transitops.com',
      name: 'Test Fleet Manager',
      role: 'fleet_manager',
      password: hash,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-auth' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-auth@transitops.com', password: 'Transit@123', role: 'fleet_manager' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('fleet_manager');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-auth@transitops.com', password: 'WrongPass!', role: 'fleet_manager' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject wrong role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-auth@transitops.com', password: 'Transit@123', role: 'dispatcher' });

    expect(res.status).toBe(401);
  });

  it('should return 422 for missing password field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-auth@transitops.com' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'Transit@123', role: 'dispatcher' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test-auth@transitops.com',
      password: 'Transit@123',
      role: 'fleet_manager',
    });
    accessToken = res.body.data.accessToken;
  });

  it('should return current user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test-auth@transitops.com');
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should logout and clear refresh token', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test-auth@transitops.com',
      password: 'Transit@123',
      role: 'fleet_manager',
    });
    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/logged out/i);

    // Verify DB refresh token is cleared
    const user = await prisma.user.findUnique({
      where: { email: 'test-auth@transitops.com' },
    });
    expect(user?.refreshToken).toBeNull();
  });
});

describe('System endpoints', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
