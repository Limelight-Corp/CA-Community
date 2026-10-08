import { z } from 'zod';

export const ContentBlockSchema = z.object({
  key: z.string().trim().min(2),
  section: z.string().trim().min(2),
  title: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  content: z.record(z.any()),
});
export type ContentBlockInput = z.infer<typeof ContentBlockSchema>;

export const UpdateContentBlockSchema = z.object({
  title: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  content: z.record(z.any()),
});
export type UpdateContentBlockInput = z.infer<typeof UpdateContentBlockSchema>;
