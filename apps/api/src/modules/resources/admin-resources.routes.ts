import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { ResourcesController } from './resources.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminResourcesRouter(
  controller: ResourcesController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.post(
    '/',
    requirePermission(PERMISSIONS.RESOURCES_CREATE),
    asyncHandler(controller.adminCreateResource)
  );

  return router;
}
