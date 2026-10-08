import { z } from 'zod';

export const UpdateMemberProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2).optional(),
  firmName: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  bio: z.string().trim().max(1000).optional(),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  wingPreferences: z.array(z.number().int().min(1).max(10)).optional(),
});
export type UpdateMemberProfileInput = z.infer<typeof UpdateMemberProfileSchema>;

export const MemberQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(['All', 'Core', 'Associate', 'Student']).default('All'),
  city: z.string().optional(),
  status: z.enum(['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED']).default('ALL'),
});
export type MemberQueryInput = z.infer<typeof MemberQuerySchema>;

export const UpdateMemberStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']),
  reason: z.string().trim().optional(),
});
export type UpdateMemberStatusInput = z.infer<typeof UpdateMemberStatusSchema>;
