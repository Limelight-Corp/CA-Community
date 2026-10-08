import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { ResourcesService } from './resources.service';

export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  listResources = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string | undefined;
    const wingId = req.query.wingId as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await this.resourcesService.listResources({
      page,
      limit,
      category,
      wingId,
      search,
    });

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

  downloadResource = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isMember = !!req.user;

    const result = await this.resourcesService.downloadResource(id, isMember);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Resource download link generated',
    };

    res.status(200).json(response);
  };

  adminCreateResource = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const resource = await this.resourcesService.createResource(req.body, adminId);

    const response: ApiResponse<typeof resource> = {
      success: true,
      data: resource,
      message: 'Resource published successfully',
    };

    res.status(201).json(response);
  };
}
