import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { vehicleRouter } from '../modules/vehicles/vehicle.routes';
import { driverRouter } from '../modules/drivers/driver.routes';
import { tripRouter } from '../modules/trips/trip.routes';
import { maintenanceRouter } from '../modules/maintenance/maintenance.routes';
import { fuelLogRouter } from '../modules/fuelLogs/fuelLog.routes';
import { expenseRouter } from '../modules/expenses/expense.routes';
import { notificationRouter } from '../modules/notifications/notification.routes';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { settingsRouter } from '../modules/settings/settings.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/drivers', driverRouter);
apiRouter.use('/trips', tripRouter);
apiRouter.use('/maintenance', maintenanceRouter);
apiRouter.use('/fuel-logs', fuelLogRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/settings', settingsRouter);
