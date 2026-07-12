import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '../src/utils/jwt';

describe('Analytics Endpoints', () => {
  let analystToken: string;

  beforeAll(() => {
    analystToken = generateAccessToken({ userId: '2', role: 'FINANCIAL_ANALYST', email: 'fin@test.com' });
  });

  it('/api/analytics/export.csv returns a valid CSV with correct headers', async () => {
    const res = await request(app)
      .get('/api/analytics/export.csv')
      .set('Authorization', `Bearer ${analystToken}`);
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="transitops-report-/);
    
    // Check CSV structure
    const lines = res.text.split('\n');
    expect(lines[0]).toBe('RegNo,Name,Type,Status,AcquisitionCost,Revenue,OperationalCost,ROI_Pct');
  });
});
