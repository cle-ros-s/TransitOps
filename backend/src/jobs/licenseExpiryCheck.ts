import cron from 'node-cron';
import { prisma } from '../config/prismaClient';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * Runs daily at 08:00 AM.
 * Finds drivers whose licenses expire within LICENSE_EXPIRY_WARNING_DAYS.
 * Creates in-app notifications for all active fleet_manager users.
 */
export function startLicenseExpiryJob(): void {
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running license expiry check job');
    try {
      await checkLicenseExpiry();
    } catch (error) {
      logger.error({ err: error }, 'License expiry job failed');
    }
  });

  logger.info('License expiry cron job scheduled (daily at 08:00)');
}

export async function checkLicenseExpiry(): Promise<void> {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + env.LICENSE_EXPIRY_WARNING_DAYS);

  const expiringDrivers = await prisma.driver.findMany({
    where: {
      licenseExpiryDate: { lte: warningDate },
      status: { not: 'suspended' },
    },
    orderBy: { licenseExpiryDate: 'asc' },
  });

  if (expiringDrivers.length === 0) {
    logger.info('No expiring licenses found');
    return;
  }

  logger.info(`Found ${expiringDrivers.length} drivers with expiring/expired licenses`);

  const managers = await prisma.user.findMany({
    where: { role: 'fleet_manager', isActive: true },
    select: { id: true },
  });

  if (managers.length === 0) return;

  const notifications = expiringDrivers.flatMap((driver) => {
    const daysLeft = Math.ceil(
      (driver.licenseExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = daysLeft < 0;

    return managers.map((manager) => ({
      userId: manager.id,
      title: isExpired ? 'License Expired' : 'License Expiring Soon',
      message: isExpired
        ? `Driver ${driver.name}'s license expired ${Math.abs(daysLeft)} days ago (${driver.licenseNumber}).`
        : `Driver ${driver.name}'s license expires in ${daysLeft} day(s) (${driver.licenseNumber}).`,
      type: (isExpired ? 'error' : 'warning') as 'error' | 'warning',
      link: '/drivers',
    }));
  });

  await prisma.notification.createMany({ data: notifications });
  logger.info(`Created ${notifications.length} license expiry notifications`);
}
