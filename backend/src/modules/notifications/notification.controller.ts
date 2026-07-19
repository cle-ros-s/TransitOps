import type { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../utils/apiResponse';

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 20;
      const result = await notificationService.findAll(req.user!.id, page, pageSize);
      sendSuccess(res, { notifications: result.data, unreadCount: result.unreadCount }, 200, result.pagination);
    } catch (err) { next(err); }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markRead(req.params.id, req.user!.id);
      sendSuccess(res, { message: 'Notification marked as read' });
    } catch (err) { next(err); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllRead(req.user!.id);
      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (err) { next(err); }
  }

  async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.deleteAll(req.user!.id);
      sendSuccess(res, { message: 'All notifications cleared' });
    } catch (err) { next(err); }
  }
}

export const notificationController = new NotificationController();
