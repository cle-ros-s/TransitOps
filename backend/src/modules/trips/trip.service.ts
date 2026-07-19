import { prisma } from '../../config/prismaClient';
import type { CreateTripInput, CompleteTripInput, CancelTripInput, TripQueryInput } from './trip.schema';
import { NotFoundError, BusinessRuleError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import { logger } from '../../config/logger';
import type { Prisma, Trip } from '@prisma/client';

function generateTripNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TR-${timestamp}-${random}`;
}

export class TripService {
  async findAll(query: TripQueryInput) {
    const { page, pageSize, sortBy, sortDir, search, status, vehicleId, driverId } = query;
    const skip = (page - 1) * pageSize;
    const allowedSortFields = [
      'tripNumber', 'source', 'destination', 'status',
      'startDate', 'revenue', 'cargoWeight', 'createdAt',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.TripWhereInput = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
      ...(search && {
        OR: [
          { tripNumber: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } },
          { destination: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderField]: sortDir },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, name: true, type: true } },
          driver: { select: { id: true, name: true, licenseNumber: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async findById(id: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        fuelLogs: true,
        expenses: true,
      },
    });
    if (!trip) throw new NotFoundError('Trip');
    return trip;
  }

  async create(dto: CreateTripInput): Promise<Trip> {
    // Validate vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (vehicle.status !== 'available') {
      throw new BusinessRuleError(
        `Vehicle ${vehicle.registrationNumber} is not available (current status: ${vehicle.status})`,
      );
    }

    // Validate driver
    const driver = await prisma.driver.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundError('Driver');
    if (driver.status !== 'available') {
      throw new BusinessRuleError(
        `Driver ${driver.name} is not available (current status: ${driver.status})`,
      );
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new BusinessRuleError(`Driver ${driver.name} has an expired license — cannot be assigned`);
    }

    // Cargo weight validation
    if (dto.cargoWeight > vehicle.maxLoadCapacity) {
      throw new BusinessRuleError(
        `Cargo weight (${dto.cargoWeight} kg) exceeds vehicle max capacity (${vehicle.maxLoadCapacity} kg)`,
      );
    }

    return prisma.trip.create({
      data: {
        ...dto,
        tripNumber: generateTripNumber(),
        startDate: new Date(dto.startDate),
        status: 'draft',
      },
    });
  }

  async dispatch(id: string): Promise<Trip> {
    const trip = await this.findById(id);

    if (trip.status !== 'draft') {
      throw new BusinessRuleError(
        `Trip can only be dispatched from draft status (current: ${trip.status})`,
      );
    }

    return prisma.$transaction(async (tx) => {
      // Re-validate inside transaction to avoid race conditions
      const [vehicle, driver] = await Promise.all([
        tx.vehicle.findUnique({ where: { id: trip.vehicleId } }),
        tx.driver.findUnique({ where: { id: trip.driverId } }),
      ]);

      if (!vehicle || vehicle.status !== 'available') {
        throw new BusinessRuleError('Vehicle is no longer available for dispatch');
      }
      if (!driver || driver.status !== 'available') {
        throw new BusinessRuleError('Driver is no longer available for dispatch');
      }

      const [updatedTrip] = await Promise.all([
        tx.trip.update({ where: { id }, data: { status: 'dispatched' } }),
        tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'on_trip' } }),
        tx.driver.update({ where: { id: trip.driverId }, data: { status: 'on_trip' } }),
      ]);

      logger.info(
        { tripId: id, vehicleId: trip.vehicleId, driverId: trip.driverId },
        'Trip dispatched',
      );

      return updatedTrip;
    });
  }

  async complete(id: string, dto: CompleteTripInput): Promise<Trip> {
    const trip = await this.findById(id);

    if (trip.status !== 'dispatched') {
      throw new BusinessRuleError(
        `Trip can only be completed from dispatched status (current: ${trip.status})`,
      );
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    if (dto.finalOdometer < vehicle.odometer) {
      throw new BusinessRuleError(
        `Final odometer (${dto.finalOdometer} km) cannot be less than current odometer (${vehicle.odometer} km)`,
      );
    }

    // Default fuel cost at ₹91.5/L — can be replaced with real rate
    const FUEL_COST_PER_LITER = 91.5;
    const totalFuelCost = dto.fuelConsumed * FUEL_COST_PER_LITER;
    const totalExpenseCost = (dto.toll ?? 0) + (dto.otherExpenses ?? 0);
    const actualDistance = dto.actualDistance ?? trip.plannedDistance;
    const endDate = new Date();

    return prisma.$transaction(async (tx) => {
      const [updatedTrip] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: {
            status: 'completed',
            finalOdometer: dto.finalOdometer,
            fuelConsumed: dto.fuelConsumed,
            actualDistance,
            endDate,
          },
        }),
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: {
            status: 'available',
            odometer: dto.finalOdometer,
            revenue: { increment: trip.revenue },
          },
        }),
        tx.driver.update({
          where: { id: trip.driverId },
          data: { status: 'available', totalTrips: { increment: 1 } },
        }),
        // Auto-create fuel log
        tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            tripId: id,
            date: endDate,
            liters: dto.fuelConsumed,
            costPerLiter: FUEL_COST_PER_LITER,
            totalCost: totalFuelCost,
            odometer: dto.finalOdometer,
          },
        }),
        // Auto-create expense record
        tx.expense.create({
          data: {
            tripId: id,
            vehicleId: trip.vehicleId,
            date: endDate,
            toll: dto.toll ?? 0,
            otherExpenses: dto.otherExpenses ?? 0,
            maintenanceCost: 0,
            totalCost: totalExpenseCost,
            description: `Auto-generated for trip ${trip.tripNumber}`,
          },
        }),
      ]);

      logger.info(
        { tripId: id, vehicleId: trip.vehicleId, fuelConsumed: dto.fuelConsumed },
        'Trip completed — fuel log and expense auto-created',
      );

      return updatedTrip;
    });
  }

  async cancel(id: string, dto: CancelTripInput): Promise<Trip> {
    const trip = await this.findById(id);

    if (!['draft', 'dispatched'].includes(trip.status)) {
      throw new BusinessRuleError(`Cannot cancel trip with status: ${trip.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const [updatedTrip] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: { status: 'cancelled', cancellationReason: dto.cancellationReason },
        }),
        // Restore vehicle and driver only if trip was dispatched
        ...(trip.status === 'dispatched'
          ? [
              tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'available' } }),
              tx.driver.update({ where: { id: trip.driverId }, data: { status: 'available' } }),
            ]
          : []),
      ]);

      logger.info({ tripId: id, reason: dto.cancellationReason }, 'Trip cancelled');
      return updatedTrip;
    });
  }

  async delete(id: string): Promise<void> {
    const trip = await this.findById(id);
    if (!['draft', 'cancelled'].includes(trip.status)) {
      throw new BusinessRuleError('Can only delete trips in draft or cancelled status');
    }
    await prisma.trip.delete({ where: { id } });
  }
}

export const tripService = new TripService();
