import { Request, Response, NextFunction } from 'express';
import { Role, Permission, ROLE_PERMISSIONS } from '@ascend/shared';
import { ForbiddenError, UnauthorizedError, SudoRequiredError } from '../errors/AppError';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return next(
        new ForbiddenError(`Missing required permission: ${permission}`)
      );
    }

    next();
  };
}

export function requireSudo() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const sudoExpiresAt = req.user.sudoExpiresAt;
    if (!sudoExpiresAt || Date.now() > sudoExpiresAt) {
      return next(
        new SudoRequiredError(
          'Sensitive action requires recent re-authentication (sudo mode expired)'
        )
      );
    }

    next();
  };
}
