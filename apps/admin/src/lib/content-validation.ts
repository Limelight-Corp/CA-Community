/**
 * Server-side validation for content writes. Schemas are derived from the same field
 * definitions that render the admin forms (lib/content-config.ts), so only declared fields can
 * be written (unknown keys are stripped) and each value is type/length checked.
 */
import { z } from 'zod';
import { EVENT_CATEGORIES, ORG_WINGS } from '@ascend/shared';
import { CONTENT_TYPES, type FieldDef, type ManagedContentType } from './content-config';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Site-relative path ("/uploads/x.png", "/events") or an absolute http(s) URL. Blocks javascript:, data:, //host. */
export const safeLink = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => v === '' || (/^\/(?!\/)/.test(v) && !/[\s\\]/.test(v)) || /^https?:\/\/[^\s]+$/i.test(v),
    'Enter a site path starting with / or a full https:// URL'
  );

/** Absolute http(s) URL only (external profiles, maps). */
export const externalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || /^https?:\/\/[^\s]+$/i.test(v), 'Enter a full URL starting with https://');

function fieldSchema(field: FieldDef): z.ZodTypeAny {
  const max = field.max;
  switch (field.kind) {
    case 'text':
    case 'textarea':
    case 'richtext': {
      const limit = max ?? (field.kind === 'text' ? 300 : field.kind === 'textarea' ? 5000 : 50000);
      const s = z.string().trim().max(limit, `${field.label} is too long (max ${limit} characters)`);
      return field.required ? s.min(1, `${field.label} is required`) : s;
    }
    case 'slug':
      return z.string().trim().max(80).regex(SLUG_RE, 'Use lowercase letters, numbers and hyphens only');
    case 'number': {
      let n = z.coerce.number({ invalid_type_error: `${field.label} must be a number` }).finite().int();
      if (field.min !== undefined) n = n.min(field.min, `${field.label} must be at least ${field.min}`);
      if (field.max !== undefined) n = n.max(field.max, `${field.label} must be at most ${field.max}`);
      return n;
    }
    case 'date': {
      const d = z.string().trim().refine((v) => v === '' || DATE_RE.test(v), 'Use the date picker (YYYY-MM-DD)');
      return field.required ? d.refine((v) => v !== '', `${field.label} is required`) : d;
    }
    case 'select': {
      const opts = field.options ?? [];
      if (field.allowCustom) {
        const s = z.string().trim().max(80);
        return field.required ? s.min(1, `${field.label} is required`) : s;
      }
      // Optional selects may be left empty.
      return z.string().refine((v) => opts.includes(v) || (!field.required && v === ''), `Choose a valid ${field.label.toLowerCase()}`);
    }
    case 'toggle':
      return z.boolean();
    case 'image':
    case 'url':
      return field.kind === 'url' && field.name !== 'ctaUrl' ? externalUrl : safeLink;
    case 'tags':
    case 'lines':
      return z.array(z.string().trim().min(1).max(200)).max(50);
    case 'color':
      return z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #2F6FE4');
    case 'points':
      return z
        .array(z.string().trim().max(240, 'Keep each point under 240 characters'))
        .transform((list) => list.filter(Boolean))
        .pipe(z.array(z.string()).max(field.max ?? 10, `Up to ${field.max ?? 10} points`));
    case 'stats':
      return z
        .array(z.object({ value: z.string().trim().max(12), label: z.string().trim().max(60) }))
        .transform((list) => list.filter((s) => s.value || s.label))
        .pipe(
          z
            .array(
              z.object({
                value: z.string().min(1, 'Each number needs a value'),
                label: z.string().min(1, 'Each number needs a label'),
              })
            )
            .max(field.max ?? 4, `Up to ${field.max ?? 4} numbers`)
        );
  }
}

const cache = new Map<ManagedContentType, z.ZodObject<z.ZodRawShape>>();

export function contentSchema(type: ManagedContentType): z.ZodObject<z.ZodRawShape> {
  const hit = cache.get(type);
  if (hit) return hit;
  const shape: z.ZodRawShape = {};
  for (const field of CONTENT_TYPES[type].fields) shape[field.name] = fieldSchema(field);
  const schema = z.object(shape);
  cache.set(type, schema);
  return schema;
}

// ---------------------------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------------------------

const agendaItem = z.object({
  time: z.string().trim().max(40),
  title: z.string().trim().min(1, 'Each agenda row needs a title').max(200),
  speaker: z.string().trim().max(120).optional(),
});

export const eventBaseSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    slug: z.string().trim().max(80).regex(SLUG_RE, 'Use lowercase letters, numbers and hyphens only'),
    category: z.string().refine((v) => (EVENT_CATEGORIES as readonly string[]).includes(v), 'Choose a category'),
    wingNumber: z.coerce
      .number()
      .int()
      .refine((n) => ORG_WINGS.some((w) => w.number === n), 'Choose a wing'),
    date: z.string().regex(DATE_RE, 'Event date is required'),
    time: z.string().trim().min(1, 'Start time is required').max(40),
    endTime: z.string().trim().max(40).optional(),
    mode: z.enum(['Online', 'Offline']),
    venue: z.string().trim().min(1, 'Venue (or platform) is required').max(200),
    city: z.string().trim().max(120),
    mapUrl: externalUrl.optional(),
    fee: z.coerce.number().finite().min(0, 'Fee cannot be negative').max(10_000_000),
    memberFee: z.coerce.number().finite().min(0, 'Member fee cannot be negative').max(10_000_000),
    seatsTotal: z.coerce.number().int().min(0, 'Capacity cannot be negative').max(1_000_000),
    cpeHours: z.coerce.number().finite().min(0, 'CPE hours cannot be negative').max(100, 'Up to 100 hours').optional(),
    speakerSlugs: z.array(z.string().trim().max(80)).max(50),
    description: z.string().trim().min(1, 'Description is required').max(20000),
    agenda: z.array(agendaItem).max(100),
    terms: z.string().trim().max(20000).optional(),
    imageUrl: safeLink.optional(),
    registrationOpen: z.boolean(),
    featured: z.boolean(),
    isPublished: z.boolean(),
});

/** Cross-field rules, applied to the full event (existing record merged with the update). */
export function eventCrossFieldErrors(v: {
  mode?: string;
  city?: string;
  fee?: number;
  memberFee?: number;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (v.mode === 'Offline' && !v.city) errors.city = 'City is required for offline events';
  if ((Number(v.memberFee) || 0) > (Number(v.fee) || 0)) {
    errors.memberFee = 'Member fee should not exceed the standard fee';
  }
  return errors;
}

export const eventUpdateSchema = eventBaseSchema.partial();

export type EventInput = z.infer<typeof eventBaseSchema>;

/** Flattens zod issues into { field: message } for form display. */
export function issuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
