import { prisma } from '../../config/prismaClient';
import type { CreateDriverInput, UpdateDriverInput } from './driver.schema';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import { env } from '../../config/env';
import type { Prisma, Driver } from '@prisma/client';

export class DriverService {
  async findAll(query: { page: number; pageSize: number; sortBy: string; sortDir: 'asc' | 'desc'; search?: string; status?: string }) {
    const { page, pageSize, sortBy, sortDir, search, status } = query;
    const skip = (page - 1) * pageSize;
    const allowedSortFields = ['name', 'safetyScore', 'tripCompletionRate', 'totalTrips', 'licenseExpiryDate', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.DriverWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status: status as Driver['status'] }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.driver.findMany({
        where, skip, take: pageSize,
        orderBy: { [orderField]: sortDir },
        include: { _count: { select: { trips: true } } },
      }),
      prisma.driver.count({ where }),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async findById(id: string): Promise<Driver & { _count: { trips: number } }> {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { _count: { select: { trips: true } } },
    });
    if (!driver) throw new NotFoundError('Driver');
    return driver as Driver & { _count: { trips: number } };
  }

  async create(dto: CreateDriverInput): Promise<Driver> {
    const existing = await prisma.driver.findFirst({
      where: {
        OR: [
          { licenseNumber: dto.licenseNumber },
          { email: dto.email.toLowerCase() },
        ],
      },
    });
    if (existing) throw new ConflictError('Driver with this license or email already exists');

    return prisma.driver.create({
      data: {
        ...dto,
        email: dto.email.toLowerCase(),
        licenseExpiryDate: new Date(dto.licenseExpiryDate),
        joinDate: new Date(dto.joinDate),
      },
    });
  }

  async update(id: string, dto: UpdateDriverInput): Promise<Driver> {
    const driver = await this.findById(id);

    // Business rule: cannot suspend if on active trip
    if (dto.status === 'suspended' && driver.status === 'on_trip') {
      throw new BusinessRuleError('Cannot suspend driver while on an active trip');
    }

    return prisma.driver.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.licenseExpiryDate && { licenseExpiryDate: new Date(dto.licenseExpiryDate) }),
        ...(dto.joinDate && { joinDate: new Date(dto.joinDate) }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const driver = await this.findById(id);
    if (driver.status === 'on_trip') {
      throw new BusinessRuleError('Cannot delete driver currently on a trip');
    }
    await prisma.driver.delete({ where: { id } });
  }

  async getExpiringLicenses(): Promise<Driver[]> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + env.LICENSE_EXPIRY_WARNING_DAYS);
    return prisma.driver.findMany({
      where: { licenseExpiryDate: { lte: warningDate } },
      orderBy: { licenseExpiryDate: 'asc' },
    });
  }

  async getAvailable(): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: { status: 'available', licenseExpiryDate: { gt: new Date() } },
    });
  }
}

export const driverService = new DriverService();
