import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { CORRELATION_ID_HEADER } from '../config/constants';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.correlationId = (req.headers[CORRELATION_ID_HEADER] as string) ?? uuidv4();
  req.startTime = Date.now();

  res.setHeader(CORRELATION_ID_HEADER, req.correlationId);

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    const logFn =
      res.statusCode >= 500
        ? logger.error.bind(logger)
        : res.statusCode >= 400
          ? logger.warn.bind(logger)
          : logger.info.bind(logger);

    logFn(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        correlationId: req.correlationId,
        userId: req.user?.id,
        ip: req.ip,
      },
      `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
    );
  });

  next();
}
