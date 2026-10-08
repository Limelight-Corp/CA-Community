import { Router } from 'express';
import {
  LoginWithEmailSchema,
  LoginWithOtpSchema,
  VerifyOtpSchema,
  MemberRegisterSchema,
} from '@ascend/shared';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authRateLimiter, otpRateLimiter } from '../../middlewares/rateLimiter';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post(
    '/login-email',
    authRateLimiter,
    validate({ body: LoginWithEmailSchema }),
    asyncHandler(controller.memberLoginEmail)
  );

  router.post(
    '/send-otp',
    otpRateLimiter,
    validate({ body: LoginWithOtpSchema }),
    asyncHandler(controller.memberSendOtp)
  );

  router.post(
    '/verify-otp',
    authRateLimiter,
    validate({ body: VerifyOtpSchema }),
    asyncHandler(controller.memberVerifyOtp)
  );

  router.post(
    '/register',
    authRateLimiter,
    validate({ body: MemberRegisterSchema }),
    asyncHandler(controller.memberRegister)
  );

  router.post('/logout', asyncHandler(controller.memberLogout));

  return router;
}
