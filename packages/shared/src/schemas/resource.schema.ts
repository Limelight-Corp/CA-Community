import { z } from 'zod';

export const CreateResourceSchema = z.object({
  title: z.string().trim().min(3),
  category: z.string().trim().min(2),
  format: z.string().trim().min(2),
  fileUrl: z.string().url().optional(),
  wingNumber: z.number().int().min(1).max(10).optional(),
  isMembersOnly: z.boolean().default(false),
});
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

export const ResourceFilterSchema = z.object({
  category: z.string().optional(),
  wingNumber: z.coerce.number().int().min(1).max(10).optional(),
  search: z.string().optional(),
});
export type ResourceFilterInput = z.infer<typeof ResourceFilterSchema>;
