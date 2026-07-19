import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createMaintenanceSchema,
  closeMaintenanceSchema,
  maintenanceQuerySchema,
} from './maintenance.schema';

export const maintenanceRouter = Router();
maintenanceRouter.use(authenticate);

/**
 * @openapi
 * /maintenance:
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance records (paginated, filterable by status/vehicle)
 *     responses:
 *       200:
 *         description: Maintenance record list
 *   post:
 *     tags: [Maintenance]
 *     summary: Schedule maintenance (sets vehicle to in_shop)
 *     responses:
 *       201:
 *         description: Maintenance record created
 */
maintenanceRouter.get(
  '/',
  requirePermission('maintenance:read'),
  validate(maintenanceQuerySchema, 'query'),
  (req, res, next) => maintenanceController.getAll(req, res, next),
);

maintenanceRouter.get('/:id', requirePermission('maintenance:read'), (req, res, next) =>
  maintenanceController.getById(req, res, next),
);

maintenanceRouter.post(
  '/',
  requirePermission('maintenance:write'),
  validate(createMaintenanceSchema),
  (req, res, next) => maintenanceController.create(req, res, next),
);

maintenanceRouter.patch(
  '/:id/close',
  requirePermission('maintenance:write'),
  validate(closeMaintenanceSchema),
  (req, res, next) => maintenanceController.close(req, res, next),
);

maintenanceRouter.delete('/:id', requirePermission('maintenance:delete'), (req, res, next) =>
  maintenanceController.remove(req, res, next),
);
