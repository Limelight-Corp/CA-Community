import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { verifyMemberAccessToken } from '../lib/jwt';
import { ICacheStore } from '../lib/redis';

export function createAuthenticateMiddleware(cacheStore: ICacheStore) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.headers.cookie) {
        // Parse cookie header
        const match = req.headers.cookie.match(/__Host-ascend_member_sess=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new UnauthorizedError('Authentication token required'));
      }

      // Check if token is revoked in cache
      const isRevoked = await cacheStore.get(`revoked_token:${token}`);
      if (isRevoked) {
        return next(new UnauthorizedError('Token has been revoked'));
      }

      const payload = await verifyMemberAccessToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (_error) {
      next(new UnauthorizedError('Invalid or expired member session'));
    }
  };
}

export function createOptionalAuthenticateMiddleware(cacheStore: ICacheStore) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/__Host-ascend_member_sess=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next();
      }

      const isRevoked = await cacheStore.get(`revoked_token:${token}`);
      if (isRevoked) {
        return next();
      }

      const payload = await verifyMemberAccessToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (_error) {
      next();
    }
  };
}

