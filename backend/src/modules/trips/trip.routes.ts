import { Router } from 'express';
import { tripController } from './trip.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripQuerySchema,
} from './trip.schema';

export const tripRouter = Router();
tripRouter.use(authenticate);

/**
 * @openapi
 * /trips:
 *   get:
 *     tags: [Trips]
 *     summary: List trips (paginated, filterable by status/vehicle/driver)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, dispatched, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Paginated trip list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     tags: [Trips]
 *     summary: Create a new trip (draft state)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId, source, destination, cargoWeight, plannedDistance, startDate]
 *             properties:
 *               vehicleId: { type: string }
 *               driverId: { type: string }
 *               source: { type: string }
 *               destination: { type: string }
 *               cargoWeight: { type: number }
 *               plannedDistance: { type: number }
 *               revenue: { type: number }
 *               startDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Trip created
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
tripRouter.get(
  '/',
  requirePermission('trips:read'),
  validate(tripQuerySchema, 'query'),
  (req, res, next) => tripController.getAll(req, res, next),
);

tripRouter.get('/:id', requirePermission('trips:read'), (req, res, next) =>
  tripController.getById(req, res, next),
);

tripRouter.post(
  '/',
  requirePermission('trips:write'),
  validate(createTripSchema),
  (req, res, next) => tripController.create(req, res, next),
);

tripRouter.patch('/:id/dispatch', requirePermission('trips:dispatch'), (req, res, next) =>
  tripController.dispatch(req, res, next),
);

tripRouter.patch(
  '/:id/complete',
  requirePermission('trips:complete'),
  validate(completeTripSchema),
  (req, res, next) => tripController.complete(req, res, next),
);

tripRouter.patch(
  '/:id/cancel',
  requirePermission('trips:cancel'),
  validate(cancelTripSchema),
  (req, res, next) => tripController.cancel(req, res, next),
);

tripRouter.delete('/:id', requirePermission('trips:delete'), (req, res, next) =>
  tripController.remove(req, res, next),
);
