import { PrismaClient, ThemePlatform, ThemeMode, ThemeStatus } from '@prisma/client';
import { DEFAULT_DARK_TOKENS } from '@ascend/shared';

export class ThemeRepository {
  constructor(private prisma: PrismaClient) {}

  async getActiveTheme(platform: ThemePlatform = ThemePlatform.WEB, mode: ThemeMode = ThemeMode.DARK) {
    const theme = await this.prisma.themeSettings.findUnique({
      where: {
        platform_mode_status: {
          platform,
          mode,
          status: ThemeStatus.PUBLISHED,
        },
      },
    });

    if (!theme) {
      return {
        platform,
        mode,
        version: 1,
        tokens: DEFAULT_DARK_TOKENS,
        status: ThemeStatus.PUBLISHED,
        updatedAt: new Date(),
      };
    }

    return theme;
  }

  async getDraftTheme(platform: ThemePlatform = ThemePlatform.WEB, mode: ThemeMode = ThemeMode.DARK) {
    const draft = await this.prisma.themeSettings.findUnique({
      where: {
        platform_mode_status: {
          platform,
          mode,
          status: ThemeStatus.DRAFT,
        },
      },
    });

    if (!draft) {
      return this.getActiveTheme(platform, mode);
    }

    return draft;
  }

  async saveDraft(data: {
    platform?: ThemePlatform;
    mode?: ThemeMode;
    tokens: any;
    fonts?: any;
    updatedBy?: string;
  }) {
    const platform = data.platform || ThemePlatform.WEB;
    const mode = data.mode || ThemeMode.DARK;

    return this.prisma.themeSettings.upsert({
      where: {
        platform_mode_status: {
          platform,
          mode,
          status: ThemeStatus.DRAFT,
        },
      },
      update: {
        tokens: data.tokens,
        fonts: data.fonts as any,
        updatedBy: data.updatedBy,
      },
      create: {
        platform,
        mode,
        tokens: data.tokens,
        fonts: data.fonts as any,
        status: ThemeStatus.DRAFT,
        updatedBy: data.updatedBy,
      },
    });
  }

  async publishDraft(data: {
    platform?: ThemePlatform;
    mode?: ThemeMode;
    publishedBy: string;
  }) {
    const platform = data.platform || ThemePlatform.WEB;
    const mode = data.mode || ThemeMode.DARK;

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current draft
      const draft = await tx.themeSettings.findUnique({
        where: {
          platform_mode_status: {
            platform,
            mode,
            status: ThemeStatus.DRAFT,
          },
        },
      });

      const tokens = (draft ? draft.tokens : DEFAULT_DARK_TOKENS) as any;
      const fonts = draft?.fonts as any;

      // 2. Fetch current published to get version
      const currentPublished = await tx.themeSettings.findUnique({
        where: {
          platform_mode_status: {
            platform,
            mode,
            status: ThemeStatus.PUBLISHED,
          },
        },
      });

      const nextVersion = (currentPublished?.version || 0) + 1;

      // 3. Upsert published theme
      const published = await tx.themeSettings.upsert({
        where: {
          platform_mode_status: {
            platform,
            mode,
            status: ThemeStatus.PUBLISHED,
          },
        },
        update: {
          tokens,
          fonts,
          version: nextVersion,
          updatedBy: data.publishedBy,
        },
        create: {
          platform,
          mode,
          tokens,
          fonts,
          version: nextVersion,
          status: ThemeStatus.PUBLISHED,
          updatedBy: data.publishedBy,
        },
      });

      // 4. Record history snapshot
      await tx.themeHistory.create({
        data: {
          version: nextVersion,
          platform,
          mode,
          tokens,
          fonts,
          publishedBy: data.publishedBy,
        },
      });

      return published;
    });
  }

  async rollbackTheme(data: {
    version: number;
    platform?: ThemePlatform;
    mode?: ThemeMode;
    restoredBy: string;
  }) {
    const platform = data.platform || ThemePlatform.WEB;
    const mode = data.mode || ThemeMode.DARK;

    const historical = await this.prisma.themeHistory.findFirst({
      where: {
        platform,
        version: data.version,
      },
    });

    if (!historical) {
      throw new Error(`Theme version ${data.version} not found in history`);
    }

    return this.prisma.themeSettings.upsert({
      where: {
        platform_mode_status: {
          platform,
          mode,
          status: ThemeStatus.PUBLISHED,
        },
      },
      update: {
        tokens: historical.tokens as any,
        fonts: historical.fonts as any,
        version: historical.version,
        updatedBy: data.restoredBy,
      },
      create: {
        platform,
        mode,
        tokens: historical.tokens as any,
        fonts: historical.fonts as any,
        version: historical.version,
        status: ThemeStatus.PUBLISHED,
        updatedBy: data.restoredBy,
      },
    });
  }

  async getThemeHistory(platform: ThemePlatform = ThemePlatform.WEB) {
    return this.prisma.themeHistory.findMany({
      where: { platform },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }
}
