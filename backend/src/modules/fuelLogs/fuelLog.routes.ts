import { Router } from 'express';
import { fuelLogController } from './fuelLog.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

export const fuelLogRouter = Router();
fuelLogRouter.use(authenticate);

fuelLogRouter.get('/', requirePermission('fuel:read'), (req, res, next) => fuelLogController.getAll(req, res, next));
fuelLogRouter.post('/', requirePermission('fuel:write'), (req, res, next) => fuelLogController.create(req, res, next));
fuelLogRouter.delete('/:id', requirePermission('fuel:delete'), (req, res, next) => fuelLogController.remove(req, res, next));
