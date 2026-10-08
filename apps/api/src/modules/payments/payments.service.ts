import { PaymentsRepository } from './payments.repository';
import { IPaymentProvider } from './payment.provider';
import { EventsRepository } from '../events/events.repository';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError } from '../../errors/AppError';
import { OrderItemType, PaymentMethod } from '@prisma/client';
import crypto from 'crypto';

export class PaymentsService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private eventsRepository: EventsRepository,
    private paymentProvider: IPaymentProvider,
    private auditService: AuditService
  ) {}

  async createCheckoutOrder(params: {
    userId?: string;
    itemType: 'EVENT_TICKET' | 'MEMBERSHIP';
    itemId: string; // event slug or membership tier name
    attendeeDetails?: {
      name: string;
      email: string;
      phone: string;
      mno?: string;
      city: string;
      org?: string;
    };
    gstin?: string;
  }) {
    let amount = 0;

    if (params.itemType === 'EVENT_TICKET') {
      const event = await this.eventsRepository.getEventBySlug(params.itemId);
      if (!event) {
        throw new NotFoundError(`Event "${params.itemId}" not found`);
      }

      if (event.seatsTaken >= event.seatsTotal) {
        throw new BadRequestError('This event is already full');
      }

      // Determine price based on user authentication / membership
      amount = params.userId ? event.memberFee : event.fee;
    } else if (params.itemType === 'MEMBERSHIP') {
      const tier = params.itemId.toUpperCase();
      if (tier === 'STUDENT') {
        amount = 499;
      } else if (tier === 'CORE' || tier === 'ASSOCIATE') {
        amount = 1000;
      } else {
        throw new BadRequestError(`Invalid membership tier "${params.itemId}"`);
      }
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // If amount is 0 (Free event), we can create order with 0 amount
    const rzpOrder = await this.paymentProvider.createOrder({
      amount,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        itemType: params.itemType,
        itemId: params.itemId,
        userId: params.userId || 'guest',
      },
    });

    const order = await this.paymentsRepository.createOrder({
      orderNumber,
      userId: params.userId,
      itemType: params.itemType as OrderItemType,
      itemId: params.itemId,
      amount,
      currency: 'INR',
      razorpayOrderId: rzpOrder.orderId,
      gstin: params.gstin,
      billingAddress: params.attendeeDetails,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.orderId,
      amount,
      currency: 'INR',
      itemType: params.itemType,
    };
  }

  async verifyPayment(params: {
    orderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
  }) {
    const order = await this.paymentsRepository.getOrderById(params.orderId);
    if (!order) {
      throw new NotFoundError(`Order "${params.orderId}" not found`);
    }

    // Idempotency: If already paid, return existing state
    if (order.status === 'PAID') {
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        invoice: order.invoice,
        registration: order.registration,
      };
    }

    if (!order.razorpayOrderId) {
      throw new BadRequestError('Order is missing gateway order ID');
    }

    // Verify cryptographic signature
    const isValid = this.paymentProvider.verifySignature(
      order.razorpayOrderId,
      params.razorpayPaymentId,
      params.razorpaySignature
    );

    if (!isValid) {
      throw new BadRequestError('Payment signature verification failed');
    }

    // Map payment method
    let method: PaymentMethod = PaymentMethod.UPI;
    if (params.paymentMethod) {
      const pm = params.paymentMethod.toUpperCase();
      if (pm === 'CARD') method = PaymentMethod.CARD;
      else if (pm === 'NETBANKING') method = PaymentMethod.NETBANKING;
      else if (pm === 'WALLET') method = PaymentMethod.WALLET;
    }

    // Record Payment & update Order status
    const { payment } = await this.paymentsRepository.recordPayment({
      orderId: order.id,
      razorpayPaymentId: params.razorpayPaymentId,
      amount: order.amount,
      currency: order.currency,
      method,
      razorpaySignature: params.razorpaySignature,
    });

    // Generate GST Tax Invoice: SAC 998399
    // Standard reverse calculation (amount inclusive of 18% GST)
    const totalAmount = order.amount;
    const taxableAmount = Math.round(totalAmount / 1.18);
    const taxRemaining = totalAmount - taxableAmount;
    const cgstAmount = Math.floor(taxRemaining / 2);
    const sgstAmount = taxRemaining - cgstAmount;

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);
    const invoiceNumber = `ASC/${currentYear}-${nextYear}/${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const invoice = await this.paymentsRepository.createInvoice({
      invoiceNumber,
      orderId: order.id,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalAmount,
    });

    let registration = null;
    // If this was an event ticket, complete registration
    if (order.itemType === 'EVENT_TICKET') {
      const event = await this.eventsRepository.getEventBySlug(order.itemId);
      if (event) {
        const attendeeInfo = (order.billingAddress as any) || {};
        const prefix = 'ASC27';
        const slugCode = event.slug.substring(0, 3).toUpperCase();
        const sequence = String(event.seatsTaken + 1).padStart(4, '0');
        const bookingCode = `${prefix}-${slugCode}-${sequence}`;
        const qrPayload = `ASCEND:EVENT:${event.slug}:${bookingCode}:${attendeeInfo.email || order.userId}`;

        registration = await this.eventsRepository.createRegistration({
          bookingCode,
          eventId: event.id,
          userId: order.userId || undefined,
          orderId: order.id,
          attendeeName: attendeeInfo.name || 'Attendee',
          attendeeEmail: attendeeInfo.email || '',
          attendeeMobile: attendeeInfo.phone || '',
          attendeeMno: attendeeInfo.mno,
          attendeeCity: attendeeInfo.city || 'Delhi',
          attendeeOrg: attendeeInfo.org,
          feePaid: order.amount,
          qrCode: qrPayload,
        });
      }
    }

    // Audit log
    await this.auditService.log({
      userId: order.userId || undefined,
      action: 'payment:captured',
      resource: 'Payment',
      resourceId: payment.id,
      newValues: {
        orderId: order.id,
        amount: order.amount,
        invoiceNumber,
      },
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'PAID',
      invoice,
      registration,
    };
  }

  async handleWebhook(bodyString: string, signature: string, eventId: string) {
    // 1. Idempotency check
    const isAlreadyProcessed = await this.paymentsRepository.isWebhookProcessed(eventId);
    if (isAlreadyProcessed) {
      return { status: 'DUPLICATE' };
    }

    // 2. Signature verification
    const isValid = this.paymentProvider.verifyWebhookSignature(bodyString, signature);
    if (!isValid) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const payload = JSON.parse(bodyString);
    const eventType = payload.event;

    // 3. Process events
    if (eventType === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        const order = await this.paymentsRepository.getOrderByRazorpayOrderId(razorpayOrderId);
        if (order && order.status !== 'PAID') {
          await this.verifyPayment({
            orderId: order.id,
            razorpayPaymentId: paymentEntity.id,
            razorpaySignature: 'webhook_captured',
            paymentMethod: paymentEntity.method,
          });
        }
      }
    }

    // 4. Record event
    await this.paymentsRepository.recordWebhookEvent({
      eventId,
      eventType,
      payload,
      status: 'PROCESSED',
    });

    return { status: 'PROCESSED' };
  }

  async listUserInvoices(userId: string) {
    return this.paymentsRepository.listInvoicesForUser(userId);
  }

  async getInvoice(id: string, userId?: string) {
    const invoice = await this.paymentsRepository.getInvoiceById(id);
    if (!invoice) {
      throw new NotFoundError(`Invoice "${id}" not found`);
    }

    if (userId && invoice.order.userId !== userId) {
      throw new BadRequestError('Access denied to requested invoice');
    }

    return invoice;
  }
}
