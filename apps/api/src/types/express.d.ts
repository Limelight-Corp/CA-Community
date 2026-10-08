import { Role } from '@ascend/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        isTwoFactorVerified?: boolean;
        sudoExpiresAt?: number;
      };
    }
  }
}
