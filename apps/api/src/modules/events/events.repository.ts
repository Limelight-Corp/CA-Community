import { PrismaClient, EventStatus, EventMode, EventCategory } from '@prisma/client';

export class EventsRepository {
  constructor(private prisma: PrismaClient) {}

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
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.wingId) {
      where.wingId = options.wingId;
    }

    if (options.wingNumber !== undefined) {
      where.wing = { number: options.wingNumber };
    }

    if (options.mode && options.mode !== 'All') {
      where.mode = options.mode.toUpperCase() as EventMode;
    }

    if (options.category && options.category !== 'All') {
      where.category = options.category.toUpperCase() as EventCategory;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { city: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.upcomingOnly) {
      where.status = EventStatus.UPCOMING;
    }

    const [total, items] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          wing: true,
          speakers: {
            include: {
              speaker: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    return { total, items, page, limit };
  }

  async getEventBySlug(slug: string) {
    return this.prisma.event.findUnique({
      where: { slug },
      include: {
        wing: true,
        speakers: {
          include: {
            speaker: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getEventById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        wing: true,
        speakers: {
          include: {
            speaker: true,
          },
        },
      },
    });
  }

  async createRegistration(data: {
    bookingCode: string;
    eventId: string;
    userId?: string;
    orderId?: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeeMobile: string;
    attendeeMno?: string;
    attendeeCity: string;
    attendeeOrg?: string;
    feePaid: number;
    qrCode?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Increment seats taken
      const event = await tx.event.update({
        where: { id: data.eventId },
        data: {
          seatsTaken: {
            increment: 1,
          },
        },
      });

      if (event.seatsTaken > event.seatsTotal) {
        throw new Error('Event is sold out');
      }

      // 2. Create registration
      const reg = await tx.eventRegistration.create({
        data: {
          bookingCode: data.bookingCode,
          eventId: data.eventId,
          userId: data.userId,
          orderId: data.orderId,
          attendeeName: data.attendeeName,
          attendeeEmail: data.attendeeEmail,
          attendeeMobile: data.attendeeMobile,
          attendeeMno: data.attendeeMno,
          attendeeCity: data.attendeeCity,
          attendeeOrg: data.attendeeOrg,
          feePaid: data.feePaid,
          qrCode: data.qrCode,
        },
        include: {
          event: {
            include: { wing: true },
          },
        },
      });

      return reg;
    });
  }

  async getRegistrationByBookingCode(bookingCode: string) {
    return this.prisma.eventRegistration.findUnique({
      where: { bookingCode },
      include: {
        event: {
          include: {
            wing: true,
            speakers: {
              include: { speaker: true },
            },
          },
        },
        order: {
          include: {
            invoice: true,
          },
        },
      },
    });
  }

  async getUserRegistrations(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: { wing: true },
        },
        order: {
          include: { invoice: true },
        },
      },
    });
  }

  async createEvent(data: any) {
    return this.prisma.event.create({
      data,
      include: { wing: true },
    });
  }

  async updateEvent(id: string, data: any) {
    return this.prisma.event.update({
      where: { id },
      data,
      include: { wing: true },
    });
  }
}
