import { prisma } from '../../config/prismaClient';
import { NotFoundError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';
import type { Prisma } from '@prisma/client';

interface CreateExpenseDto {
  tripId: string;
  vehicleId: string;
  date: string;
  toll?: number;
  otherExpenses?: number;
  maintenanceCost?: number;
  description?: string;
}

export class ExpenseService {
  async findAll(query: { page: number; pageSize: number; sortDir: 'asc' | 'desc'; vehicleId?: string; tripId?: string }) {
    const { page, pageSize, sortDir, vehicleId, tripId } = query;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ExpenseWhereInput = {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where, skip, take: pageSize,
        orderBy: { date: sortDir },
        include: {
          vehicle: { select: { id: true, registrationNumber: true } },
          trip: { select: { id: true, tripNumber: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);
    return { data, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async create(dto: CreateExpenseDto) {
    const [trip, vehicle] = await Promise.all([
      prisma.trip.findUnique({ where: { id: dto.tripId } }),
      prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
    ]);
    if (!trip) throw new NotFoundError('Trip');
    if (!vehicle) throw new NotFoundError('Vehicle');

    const toll = dto.toll ?? 0;
    const other = dto.otherExpenses ?? 0;
    const maintenance = dto.maintenanceCost ?? 0;
    const totalCost = toll + other + maintenance;

    return prisma.expense.create({
      data: { ...dto, toll, otherExpenses: other, maintenanceCost: maintenance, totalCost, date: new Date(dto.date) },
    });
  }

  async delete(id: string): Promise<void> {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundError('Expense');
    await prisma.expense.delete({ where: { id } });
  }

  async getCostBreakdowns() {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, registrationNumber: true, name: true, revenue: true, acquisitionCost: true },
    });

    return Promise.all(vehicles.map(async (v) => {
      const [fuelAgg, maintenanceAgg, expenseAgg] = await Promise.all([
        prisma.fuelLog.aggregate({ where: { vehicleId: v.id }, _sum: { totalCost: true } }),
        prisma.maintenanceRecord.aggregate({
          where: { vehicleId: v.id, status: 'completed' },
          _sum: { actualCost: true },
        }),
        prisma.expense.aggregate({ where: { vehicleId: v.id }, _sum: { otherExpenses: true, toll: true } }),
      ]);

      const fuelCost = fuelAgg._sum.totalCost ?? 0;
      const maintenanceCost = maintenanceAgg._sum.actualCost ?? 0;
      const otherCost = (expenseAgg._sum.otherExpenses ?? 0) + (expenseAgg._sum.toll ?? 0);
      const totalCost = fuelCost + maintenanceCost + otherCost;
      const profit = v.revenue - totalCost;

      return {
        vehicleId: v.id,
        vehicleName: v.name,
        registrationNumber: v.registrationNumber,
        revenue: v.revenue,
        fuelCost, maintenanceCost, otherCost, totalCost, profit,
      };
    }));
  }
}

export const expenseService = new ExpenseService();
