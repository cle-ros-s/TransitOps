import type { Request, Response, NextFunction } from 'express';
import { driverService } from './driver.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DriverController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await driverService.findById(req.params.id));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await driverService.create(req.body), 201);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await driverService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await driverService.delete(req.params.id);
      sendSuccess(res, { message: 'Driver deleted' });
    } catch (err) { next(err); }
  }

  async getExpiringLicenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await driverService.getExpiringLicenses());
    } catch (err) { next(err); }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await driverService.getAvailable());
    } catch (err) { next(err); }
  }
}

export const driverController = new DriverController();
