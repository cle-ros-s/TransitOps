import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { setupSwagger } from './docs/swagger';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy for correct IP behind load balancers
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
      crossOriginEmbedderPolicy: false, // needed for Swagger UI
    }),
  );

  // CORS
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    }),
  );

  // Global rate limiter
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
      skip: () => env.NODE_ENV === 'test',
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // HTTP parameter pollution protection
  app.use(hpp());

  // Compression
  app.use(compression());

  // Request logging + correlation ID header
  app.use(requestLogger);

  // Health & readiness probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (_req, res) => {
    try {
      const { prisma } = await import('./config/prismaClient');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  });

  // Swagger docs
  setupSwagger(app);

  // All versioned API routes
  app.use(env.API_PREFIX, apiRouter);

  // 404 fallthrough
  app.use((_req, res) => {
    res
      .status(404)
      .json({ success: false, error: { message: 'Route not found', code: 'NOT_FOUND' } });
  });

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
}
