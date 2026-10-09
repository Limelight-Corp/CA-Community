import { ThemeTokens, DEFAULT_DARK_TOKENS } from '@ascend/shared';

/**
 * Themeable colour tokens that also have a `--<name>-rgb` channel variable
 * (see packages/ui/src/styles/tokens.css). Keys are ThemeTokens fields.
 */
export const CHANNEL_TOKENS = {
  bg: 'bg',
  card: 'card',
  fg: 'fg',
  soft: 'soft',
  lime: 'lime',
  sky: 'sky',
  cobalt: 'cobalt',
  navy: 'navy',
  mist: 'mist',
  ok: 'ok',
  warn: 'warn',
  bad: 'bad',
} as const satisfies Partial<Record<keyof ThemeTokens, string>>;

/**
 * Converts `#RGB` / `#RRGGBB` to space-separated channels ("47 91 255").
 * Returns null for anything else (rgba(), named colours), which have no channel form.
 */
export function hexToRgbChannels(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** `--<name>-rgb` declarations for every themeable colour that is a hex value. */
export function themeChannelVariables(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [field, name] of Object.entries(CHANNEL_TOKENS)) {
    const channels = hexToRgbChannels(tokens[field as keyof ThemeTokens]);
    if (channels) vars[`--${name}-rgb`] = channels;
  }
  return vars;
}

/**
 * Server-Side CSS Variable Injector string helper
 * Used in Next.js Root Layout to prevent Flash of Unstyled Content (FOUC)
 */
export function generateThemeCssVariables(tokens: ThemeTokens = DEFAULT_DARK_TOKENS): string {
  const channels = Object.entries(themeChannelVariables(tokens))
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
  return `
    :root {
      --bg: ${tokens.bg};
      --card: ${tokens.card};
      --fg: ${tokens.fg};
      --muted: ${tokens.muted};
      --faint: ${tokens.faint};
      --line: ${tokens.line};
      --soft: ${tokens.soft};
      --lime: ${tokens.lime};
      --lime-ink: ${tokens.limeInk};
      --lime-deep: ${tokens.limeDeep};
      --sky: ${tokens.sky};
      --cobalt: ${tokens.cobalt};
      --navy: ${tokens.navy};
      --mist: ${tokens.mist};
      --ok: ${tokens.ok};
      --ok-bg: ${tokens.okBg};
      --warn: ${tokens.warn};
      --warn-bg: ${tokens.warnBg};
      --bad: ${tokens.bad};
      --bad-bg: ${tokens.badBg};
      --yellow: ${tokens.yellow};
      --r: ${tokens.radius};
      --f-sans: ${tokens.fontSans};
      --f-display: ${tokens.fontDisplay};
      --f-serif: ${tokens.fontSerif};
      --f-mono: ${tokens.fontMono};
      ${channels}
    }
  `.replace(/\s+/g, ' ');
}

/**
 * WCAG 2.1 Contrast Ratio Calculator
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string): number => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return 0.5;
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const a = [r, g, b].map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return a[0]! * 0.2126 + a[1]! * 0.7152 + a[2]! * 0.0722;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
