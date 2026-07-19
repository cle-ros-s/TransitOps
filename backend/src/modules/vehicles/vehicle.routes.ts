import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from './vehicle.schema';

export const vehicleRouter = Router();
vehicleRouter.use(authenticate);

/**
 * @openapi
 * /vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: List all vehicles (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [available, on_trip, in_shop, retired] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [van, truck, mini, bus, trailer] }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vehicle list
 */
vehicleRouter.get('/', requirePermission('vehicles:read'), validate(vehicleQuerySchema, 'query'), (req, res, next) => vehicleController.getAll(req, res, next));
vehicleRouter.get('/available', requirePermission('vehicles:read'), (req, res, next) => vehicleController.getAvailable(req, res, next));
vehicleRouter.get('/:id', requirePermission('vehicles:read'), (req, res, next) => vehicleController.getById(req, res, next));
vehicleRouter.post('/', requirePermission('vehicles:write'), validate(createVehicleSchema), (req, res, next) => vehicleController.create(req, res, next));
vehicleRouter.put('/:id', requirePermission('vehicles:write'), validate(updateVehicleSchema), (req, res, next) => vehicleController.update(req, res, next));
vehicleRouter.delete('/:id', requirePermission('vehicles:delete'), (req, res, next) => vehicleController.remove(req, res, next));
