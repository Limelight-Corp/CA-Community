import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';

export function createPaymentsRouter(
  controller: PaymentsController,
  optionalAuthenticate: any,
  authenticate: any
): Router {
  const router = Router();

  router.post('/orders', optionalAuthenticate, asyncHandler(controller.createOrder));
  router.post('/verify', optionalAuthenticate, asyncHandler(controller.verifyPayment));
  router.post('/webhook', asyncHandler(controller.handleWebhook));
  router.get('/invoices', authenticate, asyncHandler(controller.listMyInvoices));
  router.get('/invoices/:id', optionalAuthenticate, asyncHandler(controller.getInvoice));

  return router;
}
