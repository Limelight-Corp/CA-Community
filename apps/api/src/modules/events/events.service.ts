import { EventsRepository } from './events.repository';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError } from '../../errors/AppError';

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
      feePaid?: number;
      orderId?: string;
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

    // Generate prototype-accurate booking code: e.g. ASC27-LAU-0613
    const prefix = 'ASC27';
    const slugCode = event.slug.substring(0, 3).toUpperCase();
    const sequence = String(event.seatsTaken + 1).padStart(4, '0');
    const bookingCode = `${prefix}-${slugCode}-${sequence}`;

    const fee = attendeeData.feePaid ?? (userId ? event.memberFee : event.fee);

    // QR code data string
    const qrPayload = `ASCEND:EVENT:${event.slug}:${bookingCode}:${attendeeData.attendeeEmail}`;

    const registration = await this.eventsRepository.createRegistration({
      bookingCode,
      eventId: event.id,
      userId,
      orderId: attendeeData.orderId,
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

  async getRegistration(bookingCode: string) {
    const registration = await this.eventsRepository.getRegistrationByBookingCode(bookingCode);
    if (!registration) {
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
