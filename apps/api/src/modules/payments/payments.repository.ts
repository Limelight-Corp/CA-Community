import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderItemType,
} from '@prisma/client';

export class PaymentsRepository {
  constructor(private prisma: PrismaClient) {}

  async createOrder(data: {
    orderNumber: string;
    userId?: string;
    itemType: OrderItemType;
    itemId: string;
    amount: number;
    currency?: string;
    razorpayOrderId: string;
    gstin?: string;
    billingAddress?: any;
  }) {
    return this.prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId: data.userId,
        itemType: data.itemType,
        itemId: data.itemId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: OrderStatus.PENDING,
        razorpayOrderId: data.razorpayOrderId,
        gstin: data.gstin,
        billingAddress: data.billingAddress,
      },
    });
  }

  async getOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        payments: true,
        invoice: true,
        registration: true,
        user: true,
      },
    });
  }

  async getOrderByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: true,
        invoice: true,
        registration: true,
      },
    });
  }

  async getOrderByRazorpayOrderId(razorpayOrderId: string) {
    return this.prisma.order.findUnique({
      where: { razorpayOrderId },
      include: {
        payments: true,
        invoice: true,
        registration: true,
        user: true,
      },
    });
  }

  async recordPayment(data: {
    orderId: string;
    razorpayPaymentId: string;
    amount: number;
    currency?: string;
    method?: PaymentMethod;
    status?: PaymentStatus;
    razorpaySignature?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: data.orderId,
          razorpayPaymentId: data.razorpayPaymentId,
          amount: data.amount,
          currency: data.currency || 'INR',
          method: data.method || PaymentMethod.UPI,
          status: data.status || PaymentStatus.CAPTURED,
          razorpaySignature: data.razorpaySignature,
          capturedAt: new Date(),
        },
      });

      // 2. Mark order as PAID
      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: { status: OrderStatus.PAID },
      });

      return { payment, updatedOrder };
    });
  }

  async createInvoice(data: {
    invoiceNumber: string;
    orderId: string;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount?: number;
    totalAmount: number;
  }) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        orderId: data.orderId,
        hsnSacCode: '998399',
        taxableAmount: data.taxableAmount,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount || 0,
        totalAmount: data.totalAmount,
      },
    });
  }

  async isWebhookProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    return !!existing;
  }

  async recordWebhookEvent(data: {
    eventId: string;
    provider?: string;
    eventType: string;
    payload: any;
    status?: string;
  }) {
    return this.prisma.webhookEvent.create({
      data: {
        eventId: data.eventId,
        provider: data.provider || 'RAZORPAY',
        eventType: data.eventType,
        payload: data.payload,
        status: data.status || 'PROCESSED',
      },
    });
  }

  async listInvoicesForUser(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              include: { memberProfile: true },
            },
            registration: {
              include: { event: true },
            },
          },
        },
      },
    });
  }
}
