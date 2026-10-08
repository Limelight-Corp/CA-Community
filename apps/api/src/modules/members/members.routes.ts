import { Router } from 'express';
import { MembersController } from './members.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createMembersRouter(
  controller: MembersController,
  authenticate: any
): Router {
  const router = Router();

  router.get('/directory', asyncHandler(controller.getDirectory));
  router.get('/me', authenticate, asyncHandler(controller.getMyProfile));
  router.put('/me', authenticate, asyncHandler(controller.updateMyProfile));

  return router;
}
