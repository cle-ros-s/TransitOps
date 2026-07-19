import { prisma } from '../../config/prismaClient';
import type { CreateVehicleInput, UpdateVehicleInput, VehicleQueryInput } from './vehicle.schema';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import type { Prisma, Vehicle } from '@prisma/client';

export class VehicleService {
  async findAll(query: VehicleQueryInput) {
    const { page, pageSize, sortBy, sortDir, search, status, type, region } = query;
    const skip = (page - 1) * pageSize;

    const allowedSortFields = ['registrationNumber', 'name', 'type', 'status', 'odometer', 'revenue', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.VehicleWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(type && { type }),
      ...(region && { region }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.vehicle.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderField]: sortDir },
        include: { documents: true, _count: { select: { trips: true } } },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async findById(id: string): Promise<Vehicle & { documents: unknown[]; _count: { trips: number } }> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { documents: true, _count: { select: { trips: true } } },
    });
    if (!vehicle) throw new NotFoundError('Vehicle');
    return vehicle as Vehicle & { documents: unknown[]; _count: { trips: number } };
  }

  async create(dto: CreateVehicleInput): Promise<Vehicle> {
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: dto.registrationNumber.toUpperCase() },
    });
    if (existing) throw new ConflictError(`Vehicle with registration ${dto.registrationNumber} already exists`);

    return prisma.vehicle.create({
      data: { ...dto, registrationNumber: dto.registrationNumber.toUpperCase() },
    });
  }

  async update(id: string, dto: UpdateVehicleInput): Promise<Vehicle> {
    await this.findById(id);
    if (dto.registrationNumber) {
      dto.registrationNumber = dto.registrationNumber.toUpperCase();
    }
    return prisma.vehicle.update({ where: { id }, data: dto });
  }

  async delete(id: string): Promise<void> {
    const vehicle = await this.findById(id);

    // Business rule: cannot delete vehicle with active maintenance
    const activeMaintenance = await prisma.maintenanceRecord.count({
      where: { vehicleId: id, status: 'active' },
    });
    if (activeMaintenance > 0) {
      throw new BusinessRuleError('Cannot delete vehicle with active maintenance records');
    }

    // Business rule: cannot retire if active trips
    if (vehicle.status === 'on_trip') {
      throw new BusinessRuleError('Cannot delete vehicle that is currently on a trip');
    }

    await prisma.vehicle.delete({ where: { id } });
  }

  async getAvailable(): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({ where: { status: 'available' } });
  }
}

export const vehicleService = new VehicleService();
