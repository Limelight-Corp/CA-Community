import { z } from 'zod';
import { APPROVED_FONTS } from '../constants/theme-tokens';

const HexOrRgbaColor = z.string().regex(
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\))$/,
  'Must be a valid hex or rgba color'
);

export const ThemeTokensSchema = z.object({
  bg: HexOrRgbaColor,
  card: HexOrRgbaColor,
  fg: HexOrRgbaColor,
  muted: HexOrRgbaColor,
  faint: HexOrRgbaColor,
  line: HexOrRgbaColor,
  soft: HexOrRgbaColor,
  lime: HexOrRgbaColor,
  limeInk: HexOrRgbaColor,
  limeDeep: HexOrRgbaColor,
  sky: HexOrRgbaColor,
  cobalt: HexOrRgbaColor,
  navy: HexOrRgbaColor,
  mist: HexOrRgbaColor,
  ok: HexOrRgbaColor,
  okBg: HexOrRgbaColor,
  warn: HexOrRgbaColor,
  warnBg: HexOrRgbaColor,
  bad: HexOrRgbaColor,
  badBg: HexOrRgbaColor,
  yellow: HexOrRgbaColor,
  radius: z.string().regex(/^\d+(px|rem)$/, 'Radius must be in px or rem'),
  fontSans: z.string().min(1),
  fontDisplay: z.string().min(1),
  fontSerif: z.string().min(1),
  fontMono: z.string().min(1),
});

export const ThemeFontsSchema = z.object({
  sans: z.enum(APPROVED_FONTS.sans),
  display: z.enum(APPROVED_FONTS.display),
  serif: z.enum(APPROVED_FONTS.serif),
  mono: z.enum(APPROVED_FONTS.mono),
});

export const UpdateThemeSettingsSchema = z.object({
  platform: z.enum(['WEB', 'MOBILE']).default('WEB'),
  mode: z.enum(['DARK', 'LIGHT']).default('DARK'),
  tokens: ThemeTokensSchema,
  fonts: ThemeFontsSchema.optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  faviconUrl: z.string().url().optional().or(z.literal('')),
  syncMobileWithWeb: z.boolean().default(true),
});
export type UpdateThemeSettingsInput = z.infer<typeof UpdateThemeSettingsSchema>;

export const PublishThemeSchema = z.object({
  versionNotes: z.string().trim().optional(),
});
export type PublishThemeInput = z.infer<typeof PublishThemeSchema>;
