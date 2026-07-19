import type { Request, Response, NextFunction } from 'express';
import type { Permission } from '../config/rbacMatrix';
import { hasPermission } from '../config/rbacMatrix';
import { sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';
import type { UserRole } from '@prisma/client';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }
    if (!hasPermission(req.user.role as UserRole, permission)) {
      logger.warn(
        { userId: req.user.id, role: req.user.role, permission, url: req.url },
        'Permission denied',
      );
      sendError(res, `Missing permission: ${permission}`, 403, 'FORBIDDEN');
      return;
    }
    next();
  };
}
