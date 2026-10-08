export interface CreateOrderParams {
  amount: number; // in INR
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
}

export interface IPaymentProvider {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifySignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(body: string, signature: string): boolean;
}
