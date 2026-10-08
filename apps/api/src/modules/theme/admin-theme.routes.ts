import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { ThemeController } from './theme.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminThemeRouter(
  controller: ThemeController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get(
    '/draft',
    requirePermission(PERMISSIONS.THEME_READ),
    asyncHandler(controller.getDraftTheme)
  );

  router.put(
    '/draft',
    requirePermission(PERMISSIONS.THEME_UPDATE),
    asyncHandler(controller.saveDraft)
  );

  router.post(
    '/publish',
    requirePermission(PERMISSIONS.THEME_PUBLISH),
    asyncHandler(controller.publishTheme)
  );

  router.post(
    '/rollback/:version',
    requirePermission(PERMISSIONS.THEME_PUBLISH),
    asyncHandler(controller.rollbackTheme)
  );

  router.get(
    '/history',
    requirePermission(PERMISSIONS.THEME_READ),
    asyncHandler(controller.getThemeHistory)
  );

  router.post(
    '/audit',
    requirePermission(PERMISSIONS.THEME_READ),
    asyncHandler(controller.auditContrast)
  );

  return router;
}
