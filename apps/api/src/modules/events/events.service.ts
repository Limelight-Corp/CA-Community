import { EventsRepository } from './events.repository';
import { AuditService } from '../audit/audit.service';
import { randomBytes } from 'crypto';
import { NotFoundError, BadRequestError } from '../../errors/AppError';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Booking code like ASC27-LAU-7K2M9QXD: the random part makes codes unguessable. */
export function newBookingCode(slug: string): string {
  const bytes = randomBytes(8);
  const random = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `ASC27-${slug.substring(0, 3).toUpperCase()}-${random}`;
}

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']);

export class EventsService {
  constructor(
    private eventsRepository: EventsRepository,
    private auditService: AuditService
  ) {}

  async listEvents(options: {
    wingId?: string;
    wingNumber?: number;
    mode?: string;
    category?: string;
    search?: string;
    upcomingOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.eventsRepository.listEvents(options);
  }

  async getEventBySlug(slug: string) {
    const event = await this.eventsRepository.getEventBySlug(slug);
    if (!event) {
      throw new NotFoundError(`Event "${slug}" not found`);
    }
    return event;
  }

  async registerForEvent(
    slug: string,
    attendeeData: {
      attendeeName: string;
      attendeeEmail: string;
      attendeeMobile: string;
      attendeeMno?: string;
      attendeeCity: string;
      attendeeOrg?: string;
    },
    userId?: string
  ) {
    const event = await this.eventsRepository.getEventBySlug(slug);
    if (!event) {
      throw new NotFoundError(`Event "${slug}" not found`);
    }

    if (event.seatsTaken >= event.seatsTotal) {
      throw new BadRequestError('This event is fully booked');
    }

    const bookingCode = newBookingCode(event.slug);

    // The fee is always the server's price. Paid tickets are only issued by the payment flow
    // (payments.service verifyPayment), so this endpoint books free events only.
    const fee = userId ? event.memberFee : event.fee;
    if (Number(fee) > 0) {
      throw new BadRequestError('This is a paid event — complete the payment to register');
    }

    // QR code data string
    const qrPayload = `ASCEND:EVENT:${event.slug}:${bookingCode}:${attendeeData.attendeeEmail}`;

    const registration = await this.eventsRepository.createRegistration({
      bookingCode,
      eventId: event.id,
      userId,
      attendeeName: attendeeData.attendeeName,
      attendeeEmail: attendeeData.attendeeEmail,
      attendeeMobile: attendeeData.attendeeMobile,
      attendeeMno: attendeeData.attendeeMno,
      attendeeCity: attendeeData.attendeeCity,
      attendeeOrg: attendeeData.attendeeOrg,
      feePaid: fee,
      qrCode: qrPayload,
    });

    return registration;
  }

  /** A registration is visible only to the member who owns it and to staff. */
  async getRegistration(bookingCode: string, viewer: { id: string; role: string }) {
    const registration = await this.eventsRepository.getRegistrationByBookingCode(bookingCode);
    if (!registration) {
      throw new NotFoundError(`Registration code "${bookingCode}" not found`);
    }
    if (registration.userId !== viewer.id && !STAFF_ROLES.has(viewer.role)) {
      // Same answer as a missing code, so codes cannot be probed.
      throw new NotFoundError(`Registration code "${bookingCode}" not found`);
    }
    return registration;
  }

  async getUserRegistrations(userId: string) {
    return this.eventsRepository.getUserRegistrations(userId);
  }

  async createEvent(data: any, adminId: string) {
    const event = await this.eventsRepository.createEvent(data);

    await this.auditService.log({
      userId: adminId,
      action: 'event:create',
      resource: 'Event',
      resourceId: event.id,
      newValues: data,
    });

    return event;
  }

  async updateEvent(id: string, data: any, adminId: string) {
    const existing = await this.eventsRepository.getEventById(id);
    if (!existing) {
      throw new NotFoundError(`Event id "${id}" not found`);
    }

    const updated = await this.eventsRepository.updateEvent(id, data);

    await this.auditService.log({
      userId: adminId,
      action: 'event:update',
      resource: 'Event',
      resourceId: updated.id,
      oldValues: existing,
      newValues: data,
    });

    return updated;
  }
}
