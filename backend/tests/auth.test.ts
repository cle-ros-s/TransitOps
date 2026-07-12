import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prismaClient';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

describe('Auth Endpoints', () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test Fleet Manager',
        email: 'test@transitops.in',
        passwordHash,
        role: Role.FLEET_MANAGER,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@transitops.in',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe('test@transitops.in');
    accessToken = res.body.data.accessToken;
  });

  it('should get current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@transitops.in');
  });

  it('should return 401 on wrong password and increment failed attempts', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@transitops.in',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.failedLoginAttempts).toBeGreaterThan(0);
  });

  it('should lock out account after 5 failed attempts', async () => {
    // We already have 1 failed attempt, do 4 more
    for (let i = 0; i < 4; i++) {
      await request(app).post('/api/auth/login').send({
        email: 'test@transitops.in',
        password: 'wrongpassword',
      });
    }

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@transitops.in',
      password: 'wrongpassword',
    });
    
    // The 5th failure sets lock (or the 6th attempt is blocked)
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/Account locked/);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.lockedUntil).not.toBeNull();
  });
});
