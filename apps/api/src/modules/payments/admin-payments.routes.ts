import { Router } from 'express';
import { PERMISSIONS } from '@ascend/shared';
import { PaymentsController } from './payments.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { requirePermission } from '../../middlewares/rbac';

export function createAdminPaymentsRouter(
  controller: PaymentsController,
  adminAuthenticate: any
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get(
    '/invoices/:id',
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    asyncHandler(controller.getInvoice)
  );

  return router;
}
