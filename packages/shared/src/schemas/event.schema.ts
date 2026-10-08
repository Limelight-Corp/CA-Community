import { z } from 'zod';

export const AgendaItemSchema = z.object({
  offsetMinutes: z.number().int().nonnegative(),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
});

export const CreateEventSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be URL-safe lowercase with hyphens'),
  title: z.string().trim().min(3, 'Title is required'),
  wingNumber: z.number().int().min(1).max(10),
  category: z.enum(['Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Career']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().trim().min(2, 'Time is required (e.g. 10:00 AM)'),
  venue: z.string().trim().min(2, 'Venue is required'),
  city: z.string().trim().min(2, 'City is required'),
  mode: z.enum(['Online', 'Offline']),
  fee: z.number().int().nonnegative('Fee must be 0 or positive'),
  memberFee: z.number().int().nonnegative('Member fee must be 0 or positive'),
  seatsTotal: z.number().int().positive('Total seats must be greater than 0'),
  speakerSlugs: z.array(z.string()).default([]),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  agenda: z.array(AgendaItemSchema).optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = CreateEventSchema.partial();
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const EventFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  category: z.enum(['All', 'Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Career']).default('All'),
  mode: z.enum(['', 'Online', 'Offline']).optional(),
  wing: z.coerce.number().int().min(1).max(10).optional(),
  city: z.string().optional(),
});
export type EventFilterInput = z.infer<typeof EventFilterSchema>;

export const RegisterEventSchema = z.object({
  eventId: z.string().trim().min(1),
  name: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number is required'),
  membershipNumber: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  organization: z.string().trim().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the registration terms and refund policy' }),
  }),
});
export type RegisterEventInput = z.infer<typeof RegisterEventSchema>;
