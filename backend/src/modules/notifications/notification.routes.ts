import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/authenticate';

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get('/', (req, res, next) => notificationController.getAll(req, res, next));
notificationRouter.patch('/read-all', (req, res, next) => notificationController.markAllRead(req, res, next));
notificationRouter.patch('/:id/read', (req, res, next) => notificationController.markRead(req, res, next));
notificationRouter.delete('/', (req, res, next) => notificationController.deleteAll(req, res, next));
