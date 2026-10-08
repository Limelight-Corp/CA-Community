import { z } from 'zod';

export const CreateNewsSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3),
  category: z.string().trim().min(2),
  date: z.string().trim(),
  summary: z.string().trim().min(10),
  content: z.string().trim().min(20),
  author: z.string().trim().default('ASCEND Secretariat'),
  coverImageUrl: z.string().url().optional(),
});
export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;

export const NewsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  category: z.string().optional(),
  search: z.string().optional(),
});
export type NewsFilterInput = z.infer<typeof NewsFilterSchema>;
