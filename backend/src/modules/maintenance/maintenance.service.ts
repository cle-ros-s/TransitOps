import { prisma } from '../../config/prismaClient';
import type { CreateMaintenanceInput, CloseMaintenanceInput, MaintenanceQueryInput } from './maintenance.schema';
import { NotFoundError, BusinessRuleError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import { logger } from '../../config/logger';
import type { Prisma, MaintenanceRecord } from '@prisma/client';

export class MaintenanceService {
  async findAll(query: MaintenanceQueryInput) {
    const { page, pageSize, sortBy, sortDir, status, vehicleId, serviceType } = query;
    const skip = (page - 1) * pageSize;
    const allowedSortFields = ['scheduledDate', 'estimatedCost', 'actualCost', 'status', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.MaintenanceRecordWhereInput = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(serviceType && { serviceType: serviceType as MaintenanceRecord['serviceType'] }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.maintenanceRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderField]: sortDir },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, name: true, type: true } },
        },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async findById(id: string) {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!record) throw new NotFoundError('Maintenance record');
    return record;
  }

  async create(dto: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    // Business rule: cannot schedule maintenance for vehicle on a trip
    if (vehicle.status === 'on_trip') {
      throw new BusinessRuleError(
        `Cannot schedule maintenance for vehicle ${vehicle.registrationNumber} — it is currently on a trip`,
      );
    }

    // Business rule: cannot schedule maintenance for a retired vehicle
    if (vehicle.status === 'retired') {
      throw new BusinessRuleError(
        `Cannot schedule maintenance for retired vehicle ${vehicle.registrationNumber}`,
      );
    }

    // Business rule: cannot add maintenance if already in_shop (another active record exists)
    if (vehicle.status === 'in_shop') {
      throw new BusinessRuleError(
        `Vehicle ${vehicle.registrationNumber} is already in the shop`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          ...dto,
          scheduledDate: new Date(dto.scheduledDate),
          status: 'active',
        },
      });

      // Set vehicle status to in_shop
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: { status: 'in_shop' },
      });

      logger.info(
        { vehicleId: dto.vehicleId, maintenanceId: record.id, serviceType: dto.serviceType },
        'Maintenance scheduled — vehicle set to in_shop',
      );

      return record;
    });
  }

  async close(id: string, dto: CloseMaintenanceInput): Promise<MaintenanceRecord> {
    const record = await this.findById(id);

    if (record.status !== 'active') {
      throw new BusinessRuleError('Maintenance record is already closed');
    }

    return prisma.$transaction(async (tx) => {
      const [updated] = await Promise.all([
        tx.maintenanceRecord.update({
          where: { id },
          data: {
            status: 'completed',
            actualCost: dto.actualCost,
            completedDate: new Date(),
          },
        }),
        tx.vehicle.update({
          where: { id: record.vehicleId },
          data: { status: 'available' },
        }),
      ]);

      logger.info(
        { maintenanceId: id, vehicleId: record.vehicleId, actualCost: dto.actualCost },
        'Maintenance closed — vehicle restored to available',
      );

      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    const record = await this.findById(id);

    if (record.status === 'active') {
      // Restore vehicle to available when cancelling active maintenance
      await prisma.$transaction(async (tx) => {
        await tx.maintenanceRecord.delete({ where: { id } });
        await tx.vehicle.update({
          where: { id: record.vehicleId },
          data: { status: 'available' },
        });
      });
    } else {
      await prisma.maintenanceRecord.delete({ where: { id } });
    }

    logger.info({ maintenanceId: id }, 'Maintenance record deleted');
  }
}

export const maintenanceService = new MaintenanceService();
