import { Router } from 'express';
import { AdminLoginSchema, AdminSudoReauthSchema } from '@ascend/shared';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authRateLimiter } from '../../middlewares/rateLimiter';

export function createAdminAuthRouter(
  controller: AuthController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.post(
    '/login',
    authRateLimiter,
    validate({ body: AdminLoginSchema }),
    asyncHandler(controller.adminLogin)
  );

  router.post(
    '/sudo',
    adminAuthenticate,
    validate({ body: AdminSudoReauthSchema }),
    asyncHandler(controller.adminSudoReauth)
  );

  router.post('/logout', adminAuthenticate, asyncHandler(controller.adminLogout));

  return router;
}
