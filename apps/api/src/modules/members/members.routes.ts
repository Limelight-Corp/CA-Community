import { Router } from 'express';
import { MembersController } from './members.controller';
import { z } from 'zod';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/i.test(v), 'Use a full https:// URL');

/**
 * Only these profile fields can be changed by the member. `.strict()` rejects anything else, so a
 * request can never smuggle Prisma nested writes (e.g. `user.update.role`) or status fields.
 */
export const UpdateMyProfileSchema = z
  .object({
    firmName: z.string().trim().max(160),
    city: z.string().trim().max(120),
    bio: z.string().trim().max(2000),
    specialization: z.string().trim().max(160),
    linkedinUrl: httpsUrl,
    avatarUrl: httpsUrl,
  })
  .partial()
  .strict();

export function createMembersRouter(
  controller: MembersController,
  authenticate: any
): Router {
  const router = Router();

  router.get('/directory', asyncHandler(controller.getDirectory));
  router.get('/me', authenticate, asyncHandler(controller.getMyProfile));
  router.put('/me', authenticate, validate({ body: UpdateMyProfileSchema }), asyncHandler(controller.updateMyProfile));

  return router;
}
