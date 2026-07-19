import type { Request, Response, NextFunction } from 'express';
import { vehicleService } from './vehicle.service';
import { sendSuccess } from '../../utils/apiResponse';

export class VehicleController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await vehicleService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.findById(req.params.id);
      sendSuccess(res, vehicle);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.create(req.body);
      sendSuccess(res, vehicle, 201);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.update(req.params.id, req.body);
      sendSuccess(res, vehicle);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vehicleService.delete(req.params.id);
      sendSuccess(res, { message: 'Vehicle deleted successfully' });
    } catch (err) { next(err); }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicles = await vehicleService.getAvailable();
      sendSuccess(res, vehicles);
    } catch (err) { next(err); }
  }
}

export const vehicleController = new VehicleController();
