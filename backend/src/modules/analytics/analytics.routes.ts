import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.use(requirePermission('analytics:read'));

analyticsRouter.get('/monthly-trends', (req, res, next) => analyticsController.getMonthlyTrends(req, res, next));
analyticsRouter.get('/vehicle-performance', (req, res, next) => analyticsController.getVehiclePerformance(req, res, next));
analyticsRouter.get('/driver-performance', (req, res, next) => analyticsController.getDriverPerformance(req, res, next));
analyticsRouter.get('/top-costly-vehicles', (req, res, next) => analyticsController.getTopCostlyVehicles(req, res, next));
analyticsRouter.get('/maintenance-costs', (req, res, next) => analyticsController.getMaintenanceCosts(req, res, next));
analyticsRouter.get('/monthly-fuel', (req, res, next) => analyticsController.getMonthlyFuel(req, res, next));
analyticsRouter.get('/monthly-expenses', (req, res, next) => analyticsController.getMonthlyExpenses(req, res, next));
analyticsRouter.get('/export/csv', (req, res, next) => analyticsController.exportCsv(req, res, next));
