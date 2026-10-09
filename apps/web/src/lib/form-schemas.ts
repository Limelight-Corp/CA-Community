import { z } from 'zod';

/** Name of the hidden honeypot field used by the public forms. */
export const HONEYPOT_FIELD = 'website';

/** Validation shared by the public forms (client hints) and their API routes (authoritative). */

const trimmed = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const mobile = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{8,15}$/, 'Enter a valid mobile number');

export const memberApplicationSchema = z.object({
  name: trimmed(120).min(2, 'Please enter your full name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  mobile,
  city: trimmed(80).min(2, 'Please enter your city'),
  plan: z.enum(['core', 'associate', 'student'], { errorMap: () => ({ message: 'Choose a membership plan' }) }),
  membershipNo: optionalText(40),
  qualificationYear: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1950 && Number(v) <= new Date().getFullYear() + 1), 'Enter a 4-digit year'),
  areaOfPractice: optionalText(120),
  organisation: optionalText(160),
  linkedinUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(v), 'Enter a full LinkedIn URL (https://linkedin.com/in/…)'),
  interests: z.array(z.number().int().min(1).max(10)).max(10).optional().default([]),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept the privacy policy to continue' }) }),
});

export type MemberApplicationInput = z.input<typeof memberApplicationSchema>;

export const contactMessageSchema = z.object({
  name: trimmed(120).min(2, 'Please enter your name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^\+?[0-9][0-9\s-]{6,15}$/.test(v), 'Enter a valid phone number'),
  subject: trimmed(160).min(3, 'Please add a subject'),
  message: trimmed(4000).min(10, 'Please write a little more (at least 10 characters)'),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;

/** Flattens zod issues into a { field: message } map (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
