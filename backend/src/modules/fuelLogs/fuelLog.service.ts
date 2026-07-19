import { prisma } from '../../config/prismaClient';
import { NotFoundError, BusinessRuleError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import type { Prisma } from '@prisma/client';

interface CreateFuelLogDto {
  vehicleId: string;
  tripId?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  odometer: number;
  fuelStation?: string;
}

export class FuelLogService {
  async findAll(query: { page: number; pageSize: number; sortDir: 'asc' | 'desc'; vehicleId?: string; tripId?: string }) {
    const { page, pageSize, sortDir, vehicleId, tripId } = query;
    const skip = (page - 1) * pageSize;
    const where: Prisma.FuelLogWhereInput = {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.fuelLog.findMany({
        where, skip, take: pageSize,
        orderBy: { date: sortDir },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, name: true } },
          trip: { select: { id: true, tripNumber: true } },
        },
      }),
      prisma.fuelLog.count({ where }),
    ]);
    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async create(dto: CreateFuelLogDto) {
    if (dto.liters <= 0) throw new BusinessRuleError('Liters must be greater than zero');
    if (dto.costPerLiter <= 0) throw new BusinessRuleError('Cost per liter must be positive');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    if (dto.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: dto.tripId } });
      if (!trip) throw new NotFoundError('Trip');
    }

    const totalCost = dto.liters * dto.costPerLiter;
    return prisma.fuelLog.create({
      data: { ...dto, totalCost, date: new Date(dto.date) },
    });
  }

  async delete(id: string): Promise<void> {
    const log = await prisma.fuelLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundError('Fuel log');
    if (log.tripId) throw new BusinessRuleError('Cannot delete auto-generated fuel log linked to a trip. Cancel the trip instead.');
    await prisma.fuelLog.delete({ where: { id } });
  }
}

export const fuelLogService = new FuelLogService();
