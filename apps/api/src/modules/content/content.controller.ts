import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { ContentService } from './content.service';

export class ContentController {
  constructor(private contentService: ContentService) {}

  getBlock = async (req: Request, res: Response) => {
    const key = req.params.key as string;
    const block = await this.contentService.getBlock(key);
    const response: ApiResponse<typeof block> = {
      success: true,
      data: block,
    };
    res.status(200).json(response);
  };

  getSection = async (req: Request, res: Response) => {
    const section = req.params.section as string;
    const blocks = await this.contentService.getSection(section);
    const response: ApiResponse<typeof blocks> = {
      success: true,
      data: blocks,
    };
    res.status(200).json(response);
  };

  updateBlock = async (req: Request, res: Response) => {
    const updatedBy = req.user!.id;
    const block = await this.contentService.updateBlock(req.body, updatedBy);
    const response: ApiResponse<typeof block> = {
      success: true,
      data: block,
    };
    res.status(200).json(response);
  };

  listNews = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category as string | undefined;

    const result = await this.contentService.listNews(page, limit, category);
    const response: ApiResponse<typeof result.items> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
    res.status(200).json(response);
  };

  getNewsDetail = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const news = await this.contentService.getNewsBySlug(slug);
    const response: ApiResponse<typeof news> = {
      success: true,
      data: news,
    };
    res.status(200).json(response);
  };

  createNews = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const news = await this.contentService.createNews(req.body, adminId);
    const response: ApiResponse<typeof news> = {
      success: true,
      data: news,
    };
    res.status(201).json(response);
  };

  listWings = async (_req: Request, res: Response) => {
    const wings = await this.contentService.listWings();
    res.status(200).json({ success: true, data: wings });
  };

  listSpeakers = async (_req: Request, res: Response) => {
    const speakers = await this.contentService.listSpeakers();
    res.status(200).json({ success: true, data: speakers });
  };
}
