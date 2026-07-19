import type { Request, Response, NextFunction } from 'express';
import { tripService } from './trip.service';
import { sendSuccess } from '../../utils/apiResponse';

export class TripController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tripService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await tripService.findById(req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await tripService.create(req.body), 201);
    } catch (err) {
      next(err);
    }
  }

  async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await tripService.dispatch(req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await tripService.complete(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await tripService.cancel(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await tripService.delete(req.params.id);
      sendSuccess(res, { message: 'Trip deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const tripController = new TripController();
