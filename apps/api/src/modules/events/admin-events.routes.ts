import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { EventsController } from './events.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminEventsRouter(
  controller: EventsController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.post(
    '/',
    requirePermission(PERMISSIONS.EVENTS_CREATE),
    asyncHandler(controller.adminCreateEvent)
  );

  router.put(
    '/:id',
    requirePermission(PERMISSIONS.EVENTS_UPDATE),
    asyncHandler(controller.adminUpdateEvent)
  );

  return router;
}
