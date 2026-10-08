import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { verifyAdminAccessToken } from '../lib/jwt';
import { ICacheStore } from '../lib/redis';

export function createAdminAuthenticateMiddleware(cacheStore: ICacheStore) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/__Host-ascend_admin_sess=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new UnauthorizedError('Admin credentials required'));
      }

      // Check if token is revoked in cache
      const isRevoked = await cacheStore.get(`revoked_admin_token:${token}`);
      if (isRevoked) {
        return next(new UnauthorizedError('Admin session has been terminated'));
      }

      const payload = await verifyAdminAccessToken(token);

      // Verify administrative role
      if (!['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(payload.role)) {
        return next(new ForbiddenError('Access restricted to administrative staff'));
      }

      // Verify mandatory 2FA
      if (!payload.twoFactorVerified) {
        return next(new ForbiddenError('Two-factor authentication verification required'));
      }

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        isTwoFactorVerified: true,
        sudoExpiresAt: payload.sudoExpiresAt,
      };

      next();
    } catch (_error) {
      next(new UnauthorizedError('Invalid or expired admin session'));
    }
  };
}
