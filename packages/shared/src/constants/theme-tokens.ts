export const APPROVED_FONTS = {
  sans: ['Inter', 'Roboto', 'Plus Jakarta Sans', 'Outfit'] as const,
  display: ['Inter Tight', 'Outfit', 'Cabinet Grotesk', 'Cinzel'] as const,
  serif: ['Instrument Serif', 'Playfair Display', 'Lora', 'Merriweather'] as const,
  mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'Space Mono'] as const,
};

export interface ThemeTokens {
  bg: string;
  card: string;
  fg: string;
  muted: string;
  faint: string;
  line: string;
  soft: string;
  lime: string;
  limeInk: string;
  limeDeep: string;
  sky: string;
  cobalt: string;
  navy: string;
  mist: string;
  ok: string;
  okBg: string;
  warn: string;
  warnBg: string;
  bad: string;
  badBg: string;
  yellow: string;
  radius: string;
  fontSans: string;
  fontDisplay: string;
  fontSerif: string;
  fontMono: string;
}

export const DEFAULT_DARK_TOKENS: ThemeTokens = {
  bg: '#03050F',
  card: '#0A1130',
  fg: '#E8EFF8',
  muted: '#7F95C4',
  faint: '#4F6192',
  line: 'rgba(219,231,240,.09)',
  soft: '#0C1640',
  lime: '#2F5BFF',
  limeInk: '#FFFFFF',
  limeDeep: '#9DB6FF',
  sky: '#9DB6FF',
  cobalt: '#0F38C0',
  navy: '#0C1A58',
  mist: '#DBE7F0',
  ok: '#86EBB0',
  okBg: 'rgba(134,235,176,.12)',
  warn: '#FFD27A',
  warnBg: 'rgba(255,210,122,.12)',
  bad: '#FF9AA3',
  badBg: 'rgba(255,154,163,.14)',
  yellow: '#E6C11E',
  radius: '20px',
  fontSans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontDisplay: '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, "Times New Roman", serif',
  fontMono: '"Geist Mono", ui-monospace, Consolas, monospace',
};

export const DEFAULT_LIGHT_TOKENS: ThemeTokens = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  fg: '#060A1F',
  muted: '#475569',
  faint: '#94A3B8',
  line: 'rgba(15,23,42,.09)',
  soft: '#F1F5F9',
  lime: '#2563EB',
  limeInk: '#FFFFFF',
  limeDeep: '#1D4ED8',
  sky: '#60A5FA',
  cobalt: '#1D4ED8',
  navy: '#1E293B',
  mist: '#E2E8F0',
  ok: '#16A34A',
  okBg: 'rgba(22,163,74,.12)',
  warn: '#D97706',
  warnBg: 'rgba(217,119,6,.12)',
  bad: '#DC2626',
  badBg: 'rgba(220,38,38,.14)',
  yellow: '#CA8A04',
  radius: '20px',
  fontSans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontDisplay: '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, "Times New Roman", serif',
  fontMono: '"Geist Mono", ui-monospace, Consolas, monospace',
};
