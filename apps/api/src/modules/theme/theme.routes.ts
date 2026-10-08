import { Router } from 'express';
import { ThemeController } from './theme.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createThemeRouter(controller: ThemeController): Router {
  const router = Router();

  router.get(['/', '/active'], asyncHandler(controller.getActiveTheme));

  return router;
}
