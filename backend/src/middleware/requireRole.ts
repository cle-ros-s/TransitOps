import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.id, role: req.user.role, requiredRoles: roles, url: req.url },
        'Role violation',
      );
      sendError(res, `Access requires one of: ${roles.join(', ')}`, 403, 'FORBIDDEN');
      return;
    }
    next();
  };
}
