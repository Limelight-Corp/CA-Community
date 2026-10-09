/**
 * Declarative content-type configuration that drives the generic CMS list + form pages and the
 * server-side validation (see lib/content-validation.ts). Pure module: safe in client components.
 *
 * Events are not listed here: they have a dedicated editor (agenda, speakers, seats).
 */
import {
  GALLERY_CATEGORIES,
  NEWS_CATEGORIES,
  RESOURCE_CATEGORIES,
  type CommunityContentType,
} from '@ascend/shared';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'select'
  | 'toggle'
  | 'image'
  | 'url'
  | 'tags'
  | 'lines'
  | 'slug'
  | 'color';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** select: allowed values. */
  options?: readonly string[];
  /** select: accept values outside `options` (legacy/free categories). */
  allowCustom?: boolean;
  /** slug: field the slug is generated from. */
  slugFrom?: string;
  max?: number;
  min?: number;
  /** Takes the full form width. */
  full?: boolean;
  /** image: preview shape. */
  aspect?: 'square' | 'banner';
  defaultValue?: unknown;
}

export type ManagedContentType = Exclude<CommunityContentType, 'events'>;

export interface ContentTypeConfig {
  type: ManagedContentType;
  label: string;
  singular: string;
  description: string;
  titleField: string;
  /** Secondary line in the list (field names joined with " · "). */
  subtitleFields: string[];
  imageField?: string;
  allowCreate: boolean;
  allowDelete: boolean;
  /** Extra values merged into newly created items (not editable). */
  createDefaults?: Record<string, unknown>;
  fields: FieldDef[];
}

const TEAM_GROUPS = ['Leadership', 'Core Team', 'Advisory Board', 'Wing Conveners'] as const;

export const CONTENT_TYPES: Record<ManagedContentType, ContentTypeConfig> = {
  news: {
    type: 'news',
    label: 'News & Updates',
    singular: 'Article',
    description: 'Community announcements, event news and professional updates.',
    titleField: 'title',
    subtitleFields: ['category', 'date'],
    imageField: 'coverImageUrl',
    allowCreate: true,
    allowDelete: true,
    fields: [
      { name: 'title', label: 'Title', kind: 'text', required: true, max: 200, full: true },
      { name: 'slug', label: 'URL slug', kind: 'slug', slugFrom: 'title', required: true, hint: 'Used in the article URL: /news/your-slug' },
      { name: 'category', label: 'Category', kind: 'select', options: NEWS_CATEGORIES, allowCustom: true, required: true },
      { name: 'date', label: 'Date', kind: 'text', required: true, max: 40, placeholder: '03 Nov 2026', hint: 'Shown as written, e.g. 03 Nov 2026' },
      { name: 'author', label: 'Author', kind: 'text', max: 120 },
      { name: 'coverImageUrl', label: 'Cover image', kind: 'image', full: true },
      { name: 'summary', label: 'Summary', kind: 'textarea', required: true, max: 600, full: true },
      { name: 'content', label: 'Article body', kind: 'richtext', required: true, max: 50000, full: true, hint: 'Plain text; blank lines separate paragraphs.' },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  resources: {
    type: 'resources',
    label: 'Knowledge Hub',
    singular: 'Resource',
    description: 'Articles, guides, tax updates, webinars and downloads.',
    titleField: 'title',
    subtitleFields: ['category', 'format'],
    imageField: 'fileUrl',
    allowCreate: true,
    allowDelete: true,
    createDefaults: { downloads: 0 },
    fields: [
      { name: 'title', label: 'Title', kind: 'text', required: true, max: 200, full: true },
      { name: 'category', label: 'Category', kind: 'select', options: RESOURCE_CATEGORIES, allowCustom: true, required: true },
      { name: 'format', label: 'Format', kind: 'text', required: true, max: 80, placeholder: 'PDF · 18 pages' },
      { name: 'fileUrl', label: 'Cover image', kind: 'image', full: true },
      { name: 'isMembersOnly', label: 'Members only', kind: 'toggle', defaultValue: false },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  gallery: {
    type: 'gallery',
    label: 'Gallery',
    singular: 'Gallery item',
    description: 'Photos and videos from previous events and community activities.',
    titleField: 'title',
    subtitleFields: ['category', 'location', 'date'],
    imageField: 'imageUrl',
    allowCreate: true,
    allowDelete: true,
    createDefaults: { accentGradient: 'from-brand-900 via-brand-800 to-brand-950' },
    fields: [
      { name: 'title', label: 'Caption / title', kind: 'text', required: true, max: 200, full: true },
      { name: 'category', label: 'Category', kind: 'select', options: GALLERY_CATEGORIES, allowCustom: true, required: true },
      { name: 'date', label: 'Date', kind: 'text', required: true, max: 40, placeholder: 'January 2027' },
      { name: 'location', label: 'Location', kind: 'text', required: true, max: 160 },
      { name: 'imageUrl', label: 'Photo', kind: 'image', full: true },
      { name: 'videoUrl', label: 'Video link', kind: 'url', hint: 'YouTube or other video URL (optional)', full: true },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  speakers: {
    type: 'speakers',
    label: 'Speakers',
    singular: 'Speaker',
    description: 'Speaker profiles linked to events.',
    titleField: 'name',
    subtitleFields: ['title', 'organisation'],
    imageField: 'avatarUrl',
    allowCreate: true,
    allowDelete: true,
    fields: [
      { name: 'name', label: 'Full name', kind: 'text', required: true, max: 120 },
      { name: 'slug', label: 'URL slug', kind: 'slug', slugFrom: 'name', required: true, hint: 'Used in /speakers/your-slug and to link events' },
      { name: 'title', label: 'Designation', kind: 'text', required: true, max: 160, placeholder: 'Partner, International Tax' },
      { name: 'qualification', label: 'Qualification', kind: 'text', max: 120, placeholder: 'FCA, LL.B' },
      { name: 'organisation', label: 'Organisation', kind: 'text', max: 160 },
      { name: 'linkedinUrl', label: 'LinkedIn profile', kind: 'url' },
      { name: 'avatarUrl', label: 'Photo', kind: 'image', aspect: 'square', full: true },
      { name: 'expertise', label: 'Expertise', kind: 'tags', hint: 'Comma-separated, e.g. GST, Audit', full: true },
      { name: 'bio', label: 'Short bio', kind: 'textarea', required: true, max: 2000, full: true },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  team: {
    type: 'team',
    label: 'Team Profiles',
    singular: 'Team member',
    description: 'Leadership, core team, advisory board and wing conveners.',
    titleField: 'name',
    subtitleFields: ['designation', 'group'],
    imageField: 'photoUrl',
    allowCreate: true,
    allowDelete: true,
    fields: [
      { name: 'name', label: 'Full name', kind: 'text', required: true, max: 120 },
      { name: 'designation', label: 'Designation', kind: 'text', required: true, max: 160 },
      { name: 'group', label: 'Group', kind: 'select', options: TEAM_GROUPS, required: true, defaultValue: 'Core Team' },
      { name: 'order', label: 'Display order', kind: 'number', min: 0, max: 999, defaultValue: 10, hint: 'Lower numbers appear first' },
      { name: 'photoUrl', label: 'Photo', kind: 'image', aspect: 'square', full: true },
      { name: 'linkedinUrl', label: 'LinkedIn profile', kind: 'url', full: true },
      { name: 'background', label: 'Professional background', kind: 'textarea', max: 2000, full: true },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    description: 'Member quotes shown on the website.',
    titleField: 'name',
    subtitleFields: ['designation'],
    imageField: 'photoUrl',
    allowCreate: true,
    allowDelete: true,
    fields: [
      { name: 'name', label: 'Name', kind: 'text', required: true, max: 120 },
      { name: 'designation', label: 'Designation / city', kind: 'text', max: 160 },
      { name: 'photoUrl', label: 'Photo', kind: 'image', aspect: 'square', full: true },
      { name: 'quote', label: 'Quote', kind: 'textarea', required: true, max: 1200, full: true },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  initiatives: {
    type: 'initiatives',
    label: 'Initiatives',
    singular: 'Initiative',
    description: 'Homepage "Featured / Upcoming Initiatives".',
    titleField: 'title',
    subtitleFields: ['tag', 'date'],
    imageField: 'imageUrl',
    allowCreate: true,
    allowDelete: true,
    fields: [
      { name: 'title', label: 'Title', kind: 'text', required: true, max: 160, full: true },
      { name: 'tag', label: 'Tag / timing', kind: 'text', max: 60, placeholder: 'December 2026' },
      { name: 'date', label: 'Date', kind: 'date' },
      { name: 'ctaLabel', label: 'Button label', kind: 'text', max: 60, placeholder: 'Explore events' },
      { name: 'ctaUrl', label: 'Button link', kind: 'url', hint: 'Site path like /events or a full https:// URL' },
      { name: 'imageUrl', label: 'Image', kind: 'image', full: true },
      { name: 'description', label: 'Description', kind: 'textarea', required: true, max: 1200, full: true },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
  wings: {
    type: 'wings',
    label: 'Wings',
    singular: 'Wing',
    description: 'The ten professional wings, their focus areas and activities.',
    titleField: 'name',
    subtitleFields: ['tags'],
    allowCreate: false,
    allowDelete: false,
    fields: [
      { name: 'name', label: 'Wing name', kind: 'text', required: true, max: 120 },
      { name: 'number', label: 'Wing number', kind: 'number', required: true, min: 1, max: 99 },
      { name: 'tags', label: 'Focus areas', kind: 'text', max: 300, full: true, hint: 'Shown as one line, e.g. Direct Tax · GST · Customs' },
      { name: 'color', label: 'Accent colour', kind: 'color', required: true },
      { name: 'activities', label: 'Activities', kind: 'lines', full: true, hint: 'One activity per line' },
      { name: 'isPublished', label: 'Published on website', kind: 'toggle', defaultValue: true },
    ],
  },
};

export const CONTENT_TYPE_ORDER: ManagedContentType[] = [
  'news',
  'resources',
  'gallery',
  'speakers',
  'team',
  'testimonials',
  'initiatives',
  'wings',
];

export function isManagedContentType(value: string): value is ManagedContentType {
  return Object.prototype.hasOwnProperty.call(CONTENT_TYPES, value);
}

/** Empty form values for a new item. */
export function defaultValues(config: ContentTypeConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of config.fields) {
    if (f.defaultValue !== undefined) values[f.name] = f.defaultValue;
    else if (f.kind === 'toggle') values[f.name] = false;
    else if (f.kind === 'tags' || f.kind === 'lines') values[f.name] = [];
    else if (f.kind === 'number') values[f.name] = f.min ?? 0;
    else values[f.name] = '';
  }
  return values;
}
