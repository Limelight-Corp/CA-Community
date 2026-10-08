import { PrismaClient, MemberStatus } from '@prisma/client';

export class MembersRepository {
  constructor(private prisma: PrismaClient) {}

  async listDirectory(options: {
    city?: string;
    specialization?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: MemberStatus.ACTIVE,
    };

    if (options.city && options.city !== 'All') {
      where.city = { equals: options.city, mode: 'insensitive' };
    }

    if (options.specialization && options.specialization !== 'All') {
      where.specialization = { contains: options.specialization, mode: 'insensitive' };
    }

    if (options.search) {
      where.OR = [
        { firmName: { contains: options.search, mode: 'insensitive' } },
        { user: { email: { contains: options.search, mode: 'insensitive' } } },
        { bio: { contains: options.search, mode: 'insensitive' } },
        { specialization: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.memberProfile.count({ where }),
      this.prisma.memberProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              createdAt: true,
            },
          },
          wings: {
            include: {
              wing: true,
            },
          },
        },
      }),
    ]);

    return { total, items, page, limit };
  }

  async getMemberByUserId(userId: string) {
    return this.prisma.memberProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            mobile: true,
            role: true,
            status: true,
            isEmailVerified: true,
          },
        },
        wings: {
          include: {
            wing: true,
          },
        },
      },
    });
  }

  async getMemberById(id: string) {
    return this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: true,
        wings: {
          include: { wing: true },
        },
      },
    });
  }

  async updateProfile(userId: string, data: {
    firmName?: string;
    city?: string;
    bio?: string;
    specialization?: string;
    linkedinUrl?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.memberProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        wings: {
          include: { wing: true },
        },
      },
    });
  }

  async approveMember(id: string, approvedBy: string) {
    return this.prisma.memberProfile.update({
      where: { id },
      data: {
        status: MemberStatus.ACTIVE,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }
}
