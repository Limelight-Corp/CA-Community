import { z } from 'zod';

export const CreateOrderSchema = z.object({
  itemType: z.enum(['EVENT_TICKET', 'MEMBERSHIP']),
  itemId: z.string().trim().min(1, 'Item ID is required'),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional(),
  billingAddress: z
    .object({
      line1: z.string().trim().min(1),
      line2: z.string().trim().optional(),
      city: z.string().trim().min(1),
      state: z.string().trim().min(1),
      pincode: z.string().trim().regex(/^\d{6}$/, 'Invalid 6-digit PIN code'),
    })
    .optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

export const RefundPaymentSchema = z.object({
  paymentId: z.string().trim().min(1),
  amount: z.number().int().positive().optional(), // full refund if omitted
  reason: z.string().trim().min(3, 'Reason is required for auditing'),
});
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;

export const PaymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).default('ALL'),
  itemType: z.enum(['ALL', 'EVENT_TICKET', 'MEMBERSHIP']).default('ALL'),
  search: z.string().optional(),
});
export type PaymentQueryInput = z.infer<typeof PaymentQuerySchema>;
