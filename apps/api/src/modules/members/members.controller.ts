import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { MembersService } from './members.service';

export class MembersController {
  constructor(private membersService: MembersService) {}

  getDirectory = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const city = req.query.city as string | undefined;
    const specialization = req.query.specialization as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await this.membersService.getDirectory({
      page,
      limit,
      city,
      specialization,
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

  getMyProfile = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await this.membersService.getMyProfile(userId);

    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
    };

    res.status(200).json(response);
  };

  updateMyProfile = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updated = await this.membersService.updateMyProfile(userId, req.body);

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      message: 'Profile updated successfully',
    };

    res.status(200).json(response);
  };

  adminApproveMember = async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const memberId = req.params.id as string;
    const approved = await this.membersService.approveMember(memberId, adminId);

    const response: ApiResponse<typeof approved> = {
      success: true,
      data: approved,
      message: 'Member verified and approved',
    };

    res.status(200).json(response);
  };
}
