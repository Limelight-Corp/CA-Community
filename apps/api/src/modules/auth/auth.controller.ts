import { Request, Response } from 'express';
import { ApiResponse } from '@ascend/shared';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  memberLoginEmail = async (req: Request, res: Response) => {
    const result = await this.authService.memberLoginWithEmail(req.body);

    // Set HttpOnly Secure SameSite=Strict cookie for refresh token
    res.cookie('__Host-ascend_member_sess', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  };

  memberSendOtp = async (req: Request, res: Response) => {
    const result = await this.authService.memberSendOtp(req.body.mobile);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  };

  memberVerifyOtp = async (req: Request, res: Response) => {
    const result = await this.authService.memberVerifyOtp(req.body);

    res.cookie('__Host-ascend_member_sess', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  };

  memberRegister = async (req: Request, res: Response) => {
    const result = await this.authService.memberRegister(req.body);

    res.cookie('__Host-ascend_member_sess', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(201).json(response);
  };

  memberLogout = async (req: Request, res: Response) => {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await this.authService.logout(token, false);
    }
    res.clearCookie('__Host-ascend_member_sess');
    const response: ApiResponse<{ loggedOut: boolean }> = {
      success: true,
      data: { loggedOut: true },
    };
    res.status(200).json(response);
  };

  adminLogin = async (req: Request, res: Response) => {
    const result = await this.authService.adminLogin(req.body);

    if ('accessToken' in result) {
      res.cookie('__Host-ascend_admin_sess', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  };

  adminSudoReauth = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await this.authService.adminSudoReauth(userId, req.body);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  };

  adminLogout = async (req: Request, res: Response) => {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await this.authService.logout(token, true);
    }
    res.clearCookie('__Host-ascend_admin_sess');
    const response: ApiResponse<{ loggedOut: boolean }> = {
      success: true,
      data: { loggedOut: true },
    };
    res.status(200).json(response);
  };
}
