import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/', (req, res, next) => settingsController.get(req, res, next));
settingsRouter.put('/', (req, res, next) => settingsController.update(req, res, next));
