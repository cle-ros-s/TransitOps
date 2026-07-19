import type { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../utils/apiResponse';

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await settingsService.getAll(req.user!.id));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await settingsService.update(req.user!.id, req.body));
    } catch (err) { next(err); }
  }
}

export const settingsController = new SettingsController();
