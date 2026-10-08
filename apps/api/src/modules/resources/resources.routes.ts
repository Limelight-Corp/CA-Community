import { Router } from 'express';
import { ResourcesController } from './resources.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createResourcesRouter(
  controller: ResourcesController,
  optionalAuthenticate: any
): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.listResources));
  router.post('/:id/download', optionalAuthenticate, asyncHandler(controller.downloadResource));

  return router;
}
