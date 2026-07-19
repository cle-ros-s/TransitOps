import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/apiResponse';
import { buildCsvFromData } from './csvExporter';

export class AnalyticsController {
  async getMonthlyTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = Math.min(Number(req.query.months) || 6, 24);
      sendSuccess(res, await analyticsService.getMonthlyTrends(months));
    } catch (err) { next(err); }
  }

  async getVehiclePerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await analyticsService.getVehiclePerformance());
    } catch (err) { next(err); }
  }

  async getDriverPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await analyticsService.getDriverPerformance());
    } catch (err) { next(err); }
  }

  async getTopCostlyVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      sendSuccess(res, await analyticsService.getTopCostlyVehicles(limit));
    } catch (err) { next(err); }
  }

  async getMaintenanceCosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await analyticsService.getMaintenanceCosts());
    } catch (err) { next(err); }
  }

  async getMonthlyFuel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = Math.min(Number(req.query.months) || 6, 24);
      sendSuccess(res, await analyticsService.getMonthlyFuel(months));
    } catch (err) { next(err); }
  }

  async getMonthlyExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = Math.min(Number(req.query.months) || 6, 24);
      sendSuccess(res, await analyticsService.getMonthlyExpenses(months));
    } catch (err) { next(err); }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getVehiclePerformance();
      const csv = buildCsvFromData(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) { next(err); }
  }
}

export const analyticsController = new AnalyticsController();
