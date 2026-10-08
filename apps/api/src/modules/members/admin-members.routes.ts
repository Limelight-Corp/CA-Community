import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { MembersController } from './members.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminMembersRouter(
  controller: MembersController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.post(
    '/:id/approve',
    requirePermission(PERMISSIONS.MEMBERS_APPROVE),
    asyncHandler(controller.adminApproveMember)
  );

  return router;
}
