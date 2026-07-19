import type { Request, Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service';
import { sendSuccess } from '../../utils/apiResponse';

export class MaintenanceController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await maintenanceService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await maintenanceService.findById(req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await maintenanceService.create(req.body), 201);
    } catch (err) {
      next(err);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await maintenanceService.close(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await maintenanceService.delete(req.params.id);
      sendSuccess(res, { message: 'Maintenance record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const maintenanceController = new MaintenanceController();
