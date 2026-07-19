import { Router } from 'express';
import { driverController } from './driver.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createDriverSchema, updateDriverSchema, driverQuerySchema } from './driver.schema';

export const driverRouter = Router();
driverRouter.use(authenticate);

driverRouter.get('/', requirePermission('drivers:read'), validate(driverQuerySchema, 'query'), (req, res, next) => driverController.getAll(req, res, next));
driverRouter.get('/expiring-licenses', requirePermission('drivers:read'), (req, res, next) => driverController.getExpiringLicenses(req, res, next));
driverRouter.get('/available', requirePermission('drivers:read'), (req, res, next) => driverController.getAvailable(req, res, next));
driverRouter.get('/:id', requirePermission('drivers:read'), (req, res, next) => driverController.getById(req, res, next));
driverRouter.post('/', requirePermission('drivers:write'), validate(createDriverSchema), (req, res, next) => driverController.create(req, res, next));
driverRouter.put('/:id', requirePermission('drivers:write'), validate(updateDriverSchema), (req, res, next) => driverController.update(req, res, next));
driverRouter.delete('/:id', requirePermission('drivers:delete'), (req, res, next) => driverController.remove(req, res, next));
