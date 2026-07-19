import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
      },
    },
  }),
  base: {
    env: env.NODE_ENV,
    service: 'transitops-api',
  },
  redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      correlationId: req.headers?.['x-correlation-id'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export default logger;
