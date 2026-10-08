import { Router } from 'express';
import { EventsController } from './events.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createEventsRouter(
  controller: EventsController,
  optionalAuthenticate: any,
  authenticate: any
): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.listEvents));
  router.get('/registrations/:bookingCode', asyncHandler(controller.getRegistration));
  router.get('/user/my-registrations', authenticate, asyncHandler(controller.getUserRegistrations));
  router.get('/:slug', asyncHandler(controller.getEventBySlug));
  router.post('/:slug/register', optionalAuthenticate, asyncHandler(controller.registerForEvent));

  return router;
}
