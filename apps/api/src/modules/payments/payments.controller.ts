import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { PaymentsService } from './payments.service';

export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  createOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { itemType, itemId, attendeeDetails, gstin } = req.body;

    const result = await this.paymentsService.createCheckoutOrder({
      userId,
      itemType,
      itemId,
      attendeeDetails,
      gstin,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  };

  verifyPayment = async (req: Request, res: Response) => {
    const { orderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    const result = await this.paymentsService.verifyPayment({
      orderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Payment verified and confirmed',
    };

    res.status(200).json(response);
  };

  handleWebhook = async (req: Request, res: Response) => {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const eventId = (req.headers['x-razorpay-event-id'] as string) || `wh_${Date.now()}`;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const result = await this.paymentsService.handleWebhook(rawBody, signature, eventId);

    res.status(200).json({ status: result.status });
  };

  listMyInvoices = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const invoices = await this.paymentsService.listUserInvoices(userId);

    const response: ApiResponse<typeof invoices> = {
      success: true,
      data: invoices,
    };

    res.status(200).json(response);
  };

  getInvoice = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const invoice = await this.paymentsService.getInvoice(id, userId);

    const response: ApiResponse<typeof invoice> = {
      success: true,
      data: invoice,
    };

    res.status(200).json(response);
  };
}
