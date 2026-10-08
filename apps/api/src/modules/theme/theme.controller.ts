import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { ThemeService } from './theme.service';

export class ThemeController {
  constructor(private themeService: ThemeService) {}

  getActiveTheme = async (req: Request, res: Response) => {
    const platform = (req.query.platform as any) || 'WEB';
    const mode = (req.query.mode as any) || 'DARK';

    const theme = await this.themeService.getActiveTheme(platform, mode);

    const response: ApiResponse<typeof theme> = {
      success: true,
      data: theme,
    };

    res.status(200).json(response);
  };

  getDraftTheme = async (req: Request, res: Response) => {
    const platform = (req.query.platform as any) || 'WEB';
    const mode = (req.query.mode as any) || 'DARK';

    const draft = await this.themeService.getDraftTheme(platform, mode);

    const response: ApiResponse<typeof draft> = {
      success: true,
      data: draft,
    };

    res.status(200).json(response);
  };

  saveDraft = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const { platform, mode, tokens, fonts } = req.body;

    const saved = await this.themeService.saveDraft(
      { platform, mode, tokens, fonts },
      adminId
    );

    const response: ApiResponse<typeof saved> = {
      success: true,
      data: saved,
      message: 'Draft theme saved successfully',
    };

    res.status(200).json(response);
  };

  publishTheme = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const { platform, mode } = req.body;

    const published = await this.themeService.publishTheme(
      { platform, mode },
      adminId
    );

    const response: ApiResponse<typeof published> = {
      success: true,
      data: published,
      message: `Theme version ${published.version} published to web and mobile platforms`,
    };

    res.status(200).json(response);
  };

  rollbackTheme = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const version = Number(req.params.version);
    const { platform, mode } = req.body;

    const restored = await this.themeService.rollbackTheme(
      version,
      adminId,
      platform,
      mode
    );

    const response: ApiResponse<typeof restored> = {
      success: true,
      data: restored,
      message: `Theme successfully rolled back to version ${version}`,
    };

    res.status(200).json(response);
  };

  getThemeHistory = async (req: Request, res: Response) => {
    const platform = (req.query.platform as any) || 'WEB';
    const history = await this.themeService.getThemeHistory(platform);

    const response: ApiResponse<typeof history> = {
      success: true,
      data: history,
    };

    res.status(200).json(response);
  };

  auditContrast = async (req: Request, res: Response) => {
    const tokens = req.body.tokens;
    const audit = this.themeService.auditTokens(tokens);

    const response: ApiResponse<typeof audit> = {
      success: true,
      data: audit,
    };

    res.status(200).json(response);
  };
}
