import { Router } from 'express';
import { ContentController } from './content.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createContentRouter(controller: ContentController): Router {
  const router = Router();

  router.get('/blocks/:key', asyncHandler(controller.getBlock));
  router.get('/sections/:section', asyncHandler(controller.getSection));
  router.get('/news', asyncHandler(controller.listNews));
  router.get('/news/:slug', asyncHandler(controller.getNewsDetail));

  return router;
}
