import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { prisma } from '../config/prismaClient';
import { logger } from '../config/logger';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'Missing or invalid authorization header', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User not found or deactivated', 401, 'UNAUTHORIZED');
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (error) {
    logger.warn({ err: error, url: req.url }, 'Authentication failed');
    sendError(res, 'Invalid or expired token', 401, 'TOKEN_INVALID');
  }
}
