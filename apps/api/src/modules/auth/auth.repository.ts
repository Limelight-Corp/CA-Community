import { PrismaClient, Role, User, MemberProfile } from '@prisma/client';

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<(User & { memberProfile: MemberProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { memberProfile: true },
    });
  }

  async findByMobile(mobile: string): Promise<(User & { memberProfile: MemberProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { mobile },
      include: { memberProfile: true },
    });
  }

  async findById(id: string): Promise<(User & { memberProfile: MemberProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { memberProfile: true },
    });
  }

  async createMemberUser(data: {
    email: string;
    mobile: string;
    passwordHash?: string;
    name: string;
    city: string;
    firmName?: string;
    membershipNumberEncrypted?: string;
    qualificationYear?: number;
    membershipType: 'CORE' | 'ASSOCIATE' | 'STUDENT';
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        mobile: data.mobile,
        passwordHash: data.passwordHash,
        role: Role.MEMBER,
        isEmailVerified: true,
        isMobileVerified: true,
        memberProfile: {
          create: {
            city: data.city,
            firmName: data.firmName,
            membershipNumberEncrypted: data.membershipNumberEncrypted,
            qualificationYear: data.qualificationYear,
            membershipType: data.membershipType,
            status: 'ACTIVE',
          },
        },
      },
      include: { memberProfile: true },
    });
  }

  async updateTwoFactorSecret(userId: string, secret: string, enabled: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: enabled },
    });
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: DateTime;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshTokenFamily(family: string) {
    return this.prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true },
    });
  }
}
type DateTime = Date;
