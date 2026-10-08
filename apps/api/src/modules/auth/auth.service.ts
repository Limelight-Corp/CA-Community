import { Role } from '@ascend/shared';
import { AuthRepository } from './auth.repository';
import { AuditService } from '../audit/audit.service';
import { ICacheStore } from '../../lib/redis';
import {
  signMemberAccessToken,
  signMemberRefreshToken,
  signAdminAccessToken,
} from '../../lib/jwt';
import { verifyPassword } from '../../lib/password';
import {
  generateTotpSecret,
  generateTotpKeyUri,
  generateTotpQrCodeDataUrl,
  verifyTotpToken,
} from '../../lib/totp';
import { encryptField } from '../../lib/crypto';
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '../../errors/AppError';

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private auditService: AuditService,
    private cacheStore: ICacheStore
  ) {}

  /**
   * Member Login with Email & Password
   * Security Invariant: Only MEMBER and GUEST can log in here.
   * If an admin account tries to log in, returns a generic "Invalid credentials" error.
   */
  async memberLoginWithEmail(input: { email: string; password: string }) {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Never reveal admin existence on web portal
    if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = await signMemberAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const refreshToken = await signMemberRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        memberProfile: user.memberProfile,
      },
    };
  }

  /**
   * Member Send Mobile OTP
   */
  async memberSendOtp(mobile: string) {
    // In dev / test, fixed OTP 123456 or random 6 digits
    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    await this.cacheStore.set(`otp:${mobile}`, otp, 300); // 5 min TTL

    return {
      sent: true,
      mobile,
      expiresInSeconds: 300,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Member Verify Mobile OTP & Log In / Create Account
   */
  async memberVerifyOtp(input: { mobile: string; otp: string }) {
    const cachedOtp = await this.cacheStore.get(`otp:${input.mobile}`);
    if (!cachedOtp || cachedOtp !== input.otp) {
      throw new ValidationError('Invalid or expired OTP');
    }

    // Invalidate OTP after use
    await this.cacheStore.del(`otp:${input.mobile}`);

    let user = await this.authRepository.findByMobile(input.mobile);
    if (user && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user) {
      // Auto-create provisional member profile
      user = await this.authRepository.createMemberUser({
        email: `${input.mobile}@ascend-mobile.in`,
        mobile: input.mobile,
        name: `CA Member ${input.mobile.slice(-4)}`,
        city: 'New Delhi',
        membershipType: 'CORE',
      });
    }

    const accessToken = await signMemberAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const refreshToken = await signMemberRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        memberProfile: user.memberProfile,
      },
    };
  }

  /**
   * Member Registration
   */
  async memberRegister(input: {
    name: string;
    email: string;
    mobile: string;
    city: string;
    membershipNumber?: string;
    qualificationYear?: number;
    firmName?: string;
    plan: 'Core' | 'Associate' | 'Student';
  }) {
    const existingEmail = await this.authRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email is already registered');
    }

    const existingMobile = await this.authRepository.findByMobile(input.mobile);
    if (existingMobile) {
      throw new ConflictError('Mobile number is already registered');
    }

    const membershipNumberEncrypted = input.membershipNumber
      ? encryptField(input.membershipNumber)
      : undefined;

    const user = await this.authRepository.createMemberUser({
      email: input.email,
      mobile: input.mobile,
      name: input.name,
      city: input.city,
      firmName: input.firmName,
      membershipNumberEncrypted,
      qualificationYear: input.qualificationYear,
      membershipType: input.plan.toUpperCase() as 'CORE' | 'ASSOCIATE' | 'STUDENT',
    });

    const accessToken = await signMemberAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const refreshToken = await signMemberRefreshToken(user.id);

    await this.auditService.log({
      userId: user.id,
      action: 'member:register',
      resource: 'User',
      resourceId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        memberProfile: user.memberProfile,
      },
    };
  }

  /**
   * Admin Login with Mandatory TOTP 2FA
   */
  async adminLogin(input: { email: string; password: string; totpCode?: string }) {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid admin credentials');
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
      throw new UnauthorizedError('Invalid admin credentials');
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid admin credentials');
    }

    // 2FA Verification Flow
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!input.totpCode) {
        return {
          requires2FA: true,
          userId: user.id,
          message: 'Please provide 6-digit TOTP code from your authenticator app',
        };
      }

      const isTotpValid = verifyTotpToken(input.totpCode, user.twoFactorSecret);
      if (!isTotpValid) {
        throw new UnauthorizedError('Invalid 2FA TOTP code');
      }
    } else {
      // First-time 2FA Setup Flow for Admin
      if (!input.totpCode) {
        const secret = generateTotpSecret();
        const keyUri = generateTotpKeyUri(user.email, secret);
        const qrCodeDataUrl = await generateTotpQrCodeDataUrl(keyUri);

        // Store provisional secret in cache for 10 minutes
        await this.cacheStore.set(`pending_2fa:${user.id}`, secret, 600);

        return {
          setup2FA: true,
          userId: user.id,
          secret,
          qrCodeDataUrl,
          message: 'Scan this QR code with Google Authenticator or 1Password to activate 2FA',
        };
      }

      const pendingSecret = await this.cacheStore.get(`pending_2fa:${user.id}`);
      if (!pendingSecret) {
        throw new ValidationError('2FA setup session expired, please log in again');
      }

      const isTotpValid = verifyTotpToken(input.totpCode, pendingSecret);
      if (!isTotpValid) {
        throw new UnauthorizedError('Invalid verification code');
      }

      // Persist enabled 2FA secret
      await this.authRepository.updateTwoFactorSecret(user.id, pendingSecret, true);
      await this.cacheStore.del(`pending_2fa:${user.id}`);
    }

    const accessToken = await signAdminAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      twoFactorVerified: true,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'admin:login',
      resource: 'User',
      resourceId: user.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Admin Sudo Re-authentication for Sensitive Operations
   */
  async adminSudoReauth(userId: string, input: { password: string; totpCode?: string }) {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Incorrect password');
    }

    if (user.twoFactorEnabled && user.twoFactorSecret && input.totpCode) {
      const isTotpValid = verifyTotpToken(input.totpCode, user.twoFactorSecret);
      if (!isTotpValid) {
        throw new UnauthorizedError('Invalid 2FA code');
      }
    }

    // Grant sudo mode for 5 minutes
    const sudoExpiresAt = Date.now() + 5 * 60 * 1000;
    const elevatedToken = await signAdminAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      twoFactorVerified: true,
      sudoExpiresAt,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'admin:sudo_reauth',
      resource: 'User',
      resourceId: user.id,
    });

    return {
      sudoToken: elevatedToken,
      sudoExpiresAt,
    };
  }

  /**
   * Revoke token / Logout
   */
  async logout(token: string, isAdmin = false) {
    const prefix = isAdmin ? 'revoked_admin_token' : 'revoked_token';
    await this.cacheStore.set(`${prefix}:${token}`, 'true', 3600);
  }
}
