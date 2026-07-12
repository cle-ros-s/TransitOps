import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prismaClient';
import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';
import { generateAccessToken } from '../src/utils/jwt';

describe('Trips Lifecycle and Business Rules Endpoints', () => {
  let dispatcherToken: string;
  let vehicleId: string;
  let driverId: string;
  let tripId: string;

  beforeAll(async () => {
    dispatcherToken = generateAccessToken({ userId: '2', role: 'DISPATCHER', email: 'disp@test.com' });

    const vehicle = await prisma.vehicle.create({
      data: {
        regNo: 'TEST-V1', name: 'Test Vehicle', type: 'Van', maxLoadCapacityKg: 1000,
        acquisitionCost: 10000, status: VehicleStatus.AVAILABLE
      }
    });
    vehicleId = vehicle.id;

    const driver = await prisma.driver.create({
      data: {
        name: 'Test Driver', licenseNumber: 'TEST-LIC-1', licenseCategory: 'LMV',
        licenseExpiry: new Date(Date.now() + 86400000 * 365), contact: '1234',
        status: DriverStatus.AVAILABLE
      }
    });
    driverId = driver.id;
  });

  afterAll(async () => {
    await prisma.fuelLog.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
  });

  it('Dispatcher should be able to create a Draft trip', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        source: 'A', destination: 'B', vehicleId, driverId,
        cargoWeightKg: 500, plannedDistanceKm: 100
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(TripStatus.DRAFT);
    tripId = res.body.data.id;
  });

  it('Should block trip creation if cargo > capacity', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        source: 'A', destination: 'B', vehicleId, driverId,
        cargoWeightKg: 1500, // vehicle capacity is 1000
        plannedDistanceKm: 100
      });
    
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/Capacity exceeded by/);
  });

  it('Dispatching trip sets vehicle & driver to ON_TRIP', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/dispatch`)
      .set('Authorization', `Bearer ${dispatcherToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(TripStatus.DISPATCHED);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    
    expect(vehicle?.status).toBe(VehicleStatus.ON_TRIP);
    expect(driver?.status).toBe(DriverStatus.ON_TRIP);
  });

  it('Should block a second dispatch attempt using the same vehicle (already ON_TRIP)', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        source: 'X', destination: 'Y', vehicleId, driverId,
        cargoWeightKg: 100, plannedDistanceKm: 50
      });
    
    expect(res.status).toBe(409); // ConflictError for double-assignment
    expect(res.body.error.message).toMatch(/already ON_TRIP/);
  });

  it('Completing trip sets them back to AVAILABLE and updates odometer', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        finalOdometer: 150,
        fuelConsumedL: 10,
        fuelCost: 1000
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(TripStatus.COMPLETED);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    
    expect(vehicle?.status).toBe(VehicleStatus.AVAILABLE);
    expect(vehicle?.odometer).toBe(150);
    expect(driver?.status).toBe(DriverStatus.AVAILABLE);

    // Verify fuel log created
    const fuelLogs = await prisma.fuelLog.findMany({ where: { tripId } });
    expect(fuelLogs.length).toBe(1);
    expect(fuelLogs[0].liters).toBe(10);
  });
});
