import { prisma } from '../../config/prismaClient';
import { NotFoundError, ForbiddenError } from '../../utils/apiResponse';
import { buildPaginationMeta } from '../../utils/pagination';

export class NotificationService {
  async findAll(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    return { data, unreadCount, pagination: buildPaginationMeta(total, page, pageSize) };
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) throw new ForbiddenError();
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async create(data: { userId: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; link?: string }) {
    return prisma.notification.create({ data });
  }

  async deleteAll(userId: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { userId } });
  }
}

export const notificationService = new NotificationService();
