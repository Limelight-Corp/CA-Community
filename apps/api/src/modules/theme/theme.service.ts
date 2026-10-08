import { ThemeRepository } from './theme.repository';
import { AuditService } from '../audit/audit.service';
import { BadRequestError } from '../../errors/AppError';
import { ThemeTokensSchema, DEFAULT_DARK_TOKENS } from '@ascend/shared';

export interface ContrastAuditResult {
  pair: string;
  color1: string;
  color2: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  wcagAALarge: boolean;
}

export class ThemeService {
  constructor(
    private themeRepository: ThemeRepository,
    private auditService: AuditService
  ) {}

  // Parse color hex/rgb to RGB values
  private parseColorToRgb(color: string): [number, number, number] {
    let hex = color.trim().toLowerCase();

    // Handle rgba/rgb
    if (hex.startsWith('rgb')) {
      const match = hex.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
      }
    }

    if (hex.startsWith('#')) {
      hex = hex.slice(1);
    }

    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }

    if (hex.length >= 6) {
      const num = parseInt(hex.slice(0, 6), 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    return [0, 0, 0];
  }

  private getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return (a[0] || 0) * 0.2126 + (a[1] || 0) * 0.7152 + (a[2] || 0) * 0.0722;
  }

  calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.parseColorToRgb(color1);
    const rgb2 = this.parseColorToRgb(color2);

    const lum1 = this.getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = this.getLuminance(rgb2[0], rgb2[1], rgb2[2]);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  auditTokens(tokens: any): {
    score: 'AAA' | 'AA' | 'FAIL';
    results: ContrastAuditResult[];
  } {
    const t = { ...DEFAULT_DARK_TOKENS, ...tokens };

    const pairs: Array<{ label: string; c1: string; c2: string }> = [
      { label: 'Foreground on Background', c1: t.fg || '#E8EFF8', c2: t.bg || '#03050F' },
      { label: 'White on Primary Button', c1: t.limeInk || '#FFFFFF', c2: t.lime || '#2F5BFF' },
      { label: 'Foreground on Card', c1: t.fg || '#E8EFF8', c2: t.card || '#0A1130' },
      { label: 'Muted text on Card', c1: t.muted || '#7F95C4', c2: t.card || '#0A1130' },
      { label: 'Accent on Background', c1: t.lime || '#2F5BFF', c2: t.bg || '#03050F' },
    ];

    const results: ContrastAuditResult[] = pairs.map((p) => {
      const ratio = this.calculateContrastRatio(p.c1, p.c2);
      return {
        pair: p.label,
        color1: p.c1,
        color2: p.c2,
        ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        wcagAALarge: ratio >= 3.0,
      };
    });

    const allPassAA = results.every((r) => r.wcagAA || r.wcagAALarge);
    const allPassAAA = results.every((r) => r.wcagAAA);

    const score = allPassAAA ? 'AAA' : allPassAA ? 'AA' : 'FAIL';

    return { score, results };
  }

  async getActiveTheme(platform: any, mode: any) {
    return this.themeRepository.getActiveTheme(platform, mode);
  }

  async getDraftTheme(platform: any, mode: any) {
    return this.themeRepository.getDraftTheme(platform, mode);
  }

  async saveDraft(data: { platform?: any; mode?: any; tokens: any; fonts?: any }, adminId: string) {
    // Validate tokens structure
    const parsed = ThemeTokensSchema.safeParse(data.tokens);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid theme tokens: ${parsed.error.message}`);
    }

    const saved = await this.themeRepository.saveDraft({
      ...data,
      tokens: parsed.data,
      updatedBy: adminId,
    });

    return saved;
  }

  async publishTheme(data: { platform?: any; mode?: any }, adminId: string) {
    const published = await this.themeRepository.publishDraft({
      ...data,
      publishedBy: adminId,
    });

    await this.auditService.log({
      userId: adminId,
      action: 'theme:publish',
      resource: 'ThemeSettings',
      resourceId: published.id,
      newValues: {
        version: published.version,
        platform: published.platform,
        mode: published.mode,
      },
    });

    return published;
  }

  async rollbackTheme(version: number, adminId: string, platform?: any, mode?: any) {
    const restored = await this.themeRepository.rollbackTheme({
      version,
      platform,
      mode,
      restoredBy: adminId,
    });

    await this.auditService.log({
      userId: adminId,
      action: 'theme:rollback',
      resource: 'ThemeSettings',
      resourceId: restored.id,
      newValues: {
        version: restored.version,
      },
    });

    return restored;
  }

  async getThemeHistory(platform: any) {
    return this.themeRepository.getThemeHistory(platform);
  }
}
