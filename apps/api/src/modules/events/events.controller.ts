import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { EventsService } from './events.service';

export class EventsController {
  constructor(private eventsService: EventsService) {}

  listEvents = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const mode = req.query.mode as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const wingId = req.query.wingId as string | undefined;
    const wingNumber = req.query.wingNumber ? Number(req.query.wingNumber) : undefined;
    const upcomingOnly = req.query.upcomingOnly === 'true';

    const result = await this.eventsService.listEvents({
      page,
      limit,
      mode,
      category,
      search,
      wingId,
      wingNumber,
      upcomingOnly,
    });

    const response: ApiResponse<typeof result.items> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };

    res.status(200).json(response);
  };

  getEventBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const event = await this.eventsService.getEventBySlug(slug);

    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
    };

    res.status(200).json(response);
  };

  registerForEvent = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const userId = req.user?.id;
    const registration = await this.eventsService.registerForEvent(slug, req.body, userId);

    const response: ApiResponse<typeof registration> = {
      success: true,
      data: registration,
      message: 'Registration confirmed successfully',
    };

    res.status(201).json(response);
  };

  getRegistration = async (req: Request, res: Response) => {
    const bookingCode = req.params.bookingCode as string;
    const registration = await this.eventsService.getRegistration(bookingCode, { id: req.user!.id, role: req.user!.role });

    const response: ApiResponse<typeof registration> = {
      success: true,
      data: registration,
    };

    res.status(200).json(response);
  };

  getUserRegistrations = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const registrations = await this.eventsService.getUserRegistrations(userId);

    const response: ApiResponse<typeof registrations> = {
      success: true,
      data: registrations,
    };

    res.status(200).json(response);
  };

  adminCreateEvent = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const event = await this.eventsService.createEvent(req.body, adminId);

    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: 'Event created successfully',
    };

    res.status(201).json(response);
  };

  adminUpdateEvent = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const id = req.params.id as string;
    const event = await this.eventsService.updateEvent(id, req.body, adminId);

    const response: ApiResponse<typeof event> = {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };

    res.status(200).json(response);
  };
}
