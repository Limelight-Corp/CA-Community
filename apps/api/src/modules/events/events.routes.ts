import { Router } from 'express';
import { EventsController } from './events.controller';
import { z } from 'zod';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';

/** Attendee details only — fee and order are decided by the server, never the client. */
export const RegisterForEventSchema = z
  .object({
    attendeeName: z.string().trim().min(1).max(120),
    attendeeEmail: z.string().trim().email().max(200),
    attendeeMobile: z.string().trim().regex(/^[+\d][\d\s-]{6,18}$/, 'Enter a valid mobile number'),
    attendeeMno: z.string().trim().max(40).optional(),
    attendeeCity: z.string().trim().min(1).max(120),
    attendeeOrg: z.string().trim().max(160).optional(),
  })
  .strict();

export function createEventsRouter(
  controller: EventsController,
  optionalAuthenticate: any,
  authenticate: any
): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.listEvents));
  router.get('/registrations/:bookingCode', authenticate, asyncHandler(controller.getRegistration));
  router.get('/user/my-registrations', authenticate, asyncHandler(controller.getUserRegistrations));
  router.get('/:slug', asyncHandler(controller.getEventBySlug));
  router.post('/:slug/register', optionalAuthenticate, validate({ body: RegisterForEventSchema }), asyncHandler(controller.registerForEvent));

  return router;
}
