import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await dashboardService.getStats());
    } catch (err) { next(err); }
  }

  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      sendSuccess(res, await dashboardService.getRecentActivity(limit));
    } catch (err) { next(err); }
  }

  async getFleetHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await dashboardService.getFleetHealth());
    } catch (err) { next(err); }
  }
}

export const dashboardController = new DashboardController();
