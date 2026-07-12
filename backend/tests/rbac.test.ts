import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '../src/utils/jwt';

describe('RBAC Middleware', () => {
  let dispatcherToken: string;
  let analystToken: string;

  beforeAll(() => {
    dispatcherToken = generateAccessToken({ userId: '1', role: 'DISPATCHER', email: 'disp@test.com' });
    analystToken = generateAccessToken({ userId: '2', role: 'FINANCIAL_ANALYST', email: 'fin@test.com' });
  });

  it('Dispatcher should be blocked from Maintenance routes', async () => {
    const res = await request(app)
      .get('/api/maintenance')
      .set('Authorization', `Bearer ${dispatcherToken}`);
    expect(res.status).toBe(403);
  });

  it('Dispatcher should be able to view Vehicles', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${dispatcherToken}`);
    expect(res.status).toBe(200);
  });

  it('Dispatcher should be blocked from creating Vehicles', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ regNo: 'TEST', name: 'TEST', type: 'Van', maxLoadCapacityKg: 100, acquisitionCost: 100 });
    expect(res.status).toBe(403);
  });

  it('Analyst should be able to view Analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/fleet-utilization')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
  });

  it('Analyst should be blocked from Trips', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });
});
