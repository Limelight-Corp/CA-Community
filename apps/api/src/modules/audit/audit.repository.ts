import { PrismaClient } from '@prisma/client';

export interface CreateAuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: any;
  newValues?: any;
}

export class AuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        oldValues: data.oldValues ?? undefined,
        newValues: data.newValues ?? undefined,
      },
    });
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
    ]);
    return { total, items, page, limit };
  }
}
