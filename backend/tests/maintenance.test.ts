import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prismaClient';
import { VehicleStatus, MaintenanceStatus } from '@prisma/client';
import { generateAccessToken } from '../src/utils/jwt';

describe('Maintenance & Vehicle Business Rules', () => {
  let fleetManagerToken: string;
  let vehicleId: string;

  beforeAll(async () => {
    fleetManagerToken = generateAccessToken({ userId: '1', role: 'FLEET_MANAGER', email: 'fm@test.com' });

    const vehicle = await prisma.vehicle.create({
      data: {
        regNo: 'TEST-MAINT-1', name: 'Test Vehicle', type: 'Van', maxLoadCapacityKg: 1000,
        acquisitionCost: 10000, status: VehicleStatus.AVAILABLE
      }
    });
    vehicleId = vehicle.id;
  });

  afterAll(async () => {
    await prisma.expense.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.fuelLog.deleteMany();
    await prisma.vehicle.deleteMany();
  });

  it('Creating Active maintenance sets vehicle to IN_SHOP', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${fleetManagerToken}`)
      .send({
        vehicleId, serviceType: 'Oil Change', cost: 200, date: new Date()
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(MaintenanceStatus.ACTIVE);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe(VehicleStatus.IN_SHOP);
  });

  it('Closing maintenance restores to AVAILABLE', async () => {
    // Get the created record
    const records = await prisma.maintenanceRecord.findMany({ where: { vehicleId } });
    const recordId = records[0].id;

    const res = await request(app)
      .patch(`/api/maintenance/${recordId}/close`)
      .set('Authorization', `Bearer ${fleetManagerToken}`);
    
    expect(res.status).toBe(200);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe(VehicleStatus.AVAILABLE);
  });

  it('/api/vehicles/:id/operational-cost sums fuel + maintenance correctly', async () => {
    // Add some fuel logs
    await prisma.fuelLog.create({
      data: { vehicleId, date: new Date(), liters: 10, cost: 1000 }
    });

    const res = await request(app)
      .get(`/api/vehicles/${vehicleId}/operational-cost`)
      .set('Authorization', `Bearer ${fleetManagerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.fuelTotal).toBe(1000);
    expect(res.body.data.maintenanceTotal).toBe(200); // from first test
    expect(res.body.data.total).toBe(1200);
  });
});
