import type { Request, Response, NextFunction } from 'express';
import { fuelLogService } from './fuelLog.service';
import { sendSuccess } from '../../utils/apiResponse';

export class FuelLogController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await fuelLogService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await fuelLogService.create(req.body), 201);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await fuelLogService.delete(req.params.id);
      sendSuccess(res, { message: 'Fuel log deleted' });
    } catch (err) { next(err); }
  }
}

export const fuelLogController = new FuelLogController();
