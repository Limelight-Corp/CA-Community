import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { ContentController } from './content.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminContentRouter(
  controller: ContentController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.put(
    '/blocks/:key',
    requirePermission(PERMISSIONS.CONTENT_UPDATE),
    asyncHandler(controller.updateBlock)
  );

  router.post(
    '/news',
    requirePermission(PERMISSIONS.CONTENT_CREATE),
    asyncHandler(controller.createNews)
  );

  return router;
}
