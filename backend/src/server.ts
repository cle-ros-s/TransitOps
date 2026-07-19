import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prismaClient';
import { startLicenseExpiryJob } from './jobs/licenseExpiryCheck';

async function bootstrap(): Promise<void> {
  // Validate DB connection before starting HTTP server
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to database — exiting');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`TransitOps API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
  });

  // Cron jobs — skip in test mode
  if (env.NODE_ENV !== 'test') {
    startLicenseExpiryJob();
  }

  // ── Graceful Shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — starting graceful shutdown`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected. Bye! 👋');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
    process.exit(1);
  });
}

void bootstrap();
