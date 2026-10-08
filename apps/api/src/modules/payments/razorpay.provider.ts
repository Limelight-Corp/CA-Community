import crypto from 'crypto';
import { IPaymentProvider, CreateOrderParams, OrderResult } from './payment.provider';
import { env } from '../../config/env';

export class RazorpayProvider implements IPaymentProvider {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID || 'rzp_test_ascend_dummy';
    this.keySecret = env.RAZORPAY_KEY_SECRET || 'rzp_secret_dummy_key_12345';
    this.webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_dummy_12345';
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    // If running in live environment with actual credentials, use Razorpay REST API
    if (
      env.NODE_ENV === 'production' &&
      !this.keyId.includes('dummy') &&
      !this.keySecret.includes('dummy')
    ) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: Math.round(params.amount * 100), // Razorpay uses paisa
            currency: params.currency,
            receipt: params.receipt,
            notes: params.notes,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Razorpay API error: ${JSON.stringify(errData)}`);
        }

        const data: any = await response.json();
        return {
          orderId: data.id,
          amount: params.amount,
          currency: params.currency,
        };
      } catch (err: any) {
        throw new Error(`Failed to create Razorpay order: ${err.message}`);
      }
    }

    // In development or test sandbox, generate deterministic order ID
    const randomHex = crypto.randomBytes(8).toString('hex');
    const orderId = `order_${randomHex}`;

    return {
      orderId,
      amount: params.amount,
      currency: params.currency,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    // Standard Razorpay HMAC-SHA256 signature calculation:
    // HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    // Allow simulated test signatures in non-production environments if prefixed with 'sim_sig_'
    if (env.NODE_ENV !== 'production' && signature.startsWith('sim_sig_')) {
      return true;
    }

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    if (env.NODE_ENV !== 'production' && signature === 'test_webhook_sig') {
      return true;
    }

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }
}
