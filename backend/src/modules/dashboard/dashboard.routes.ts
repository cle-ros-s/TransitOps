import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.use(requirePermission('dashboard:read'));

dashboardRouter.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next));
dashboardRouter.get('/recent-activity', (req, res, next) => dashboardController.getRecentActivity(req, res, next));
dashboardRouter.get('/fleet-health', (req, res, next) => dashboardController.getFleetHealth(req, res, next));
