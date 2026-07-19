import type { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Operational AppErrors
  if (err instanceof AppError && err.isOperational) {
    if (err.statusCode >= 500) {
      logger.error({ err, correlationId: req.correlationId }, err.message);
    } else {
      logger.warn({ message: err.message, code: err.code, url: req.url }, 'Operational error');
    }
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Prisma known errors
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        sendError(res, 'A record with this value already exists', 409, 'CONFLICT');
        return;
      case 'P2025':
        sendError(res, 'Record not found', 404, 'NOT_FOUND');
        return;
      case 'P2003':
        sendError(res, 'Related record not found', 422, 'FOREIGN_KEY_ERROR');
        return;
      default:
        logger.error({ err }, 'Prisma error');
        sendError(res, 'Database error', 500, 'DATABASE_ERROR');
        return;
    }
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    sendError(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
    return;
  }
  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid token', 401, 'TOKEN_INVALID');
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
    return;
  }

  // Unknown / programming errors
  logger.error({ err, correlationId: req.correlationId, url: req.url }, 'Unhandled error');
  sendError(res, 'Internal server error', 500, 'INTERNAL_SERVER_ERROR');
}
