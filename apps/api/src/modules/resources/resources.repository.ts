import { PrismaClient } from '@prisma/client';

export class ResourcesRepository {
  constructor(private prisma: PrismaClient) {}

  async listResources(options: {
    category?: string;
    wingId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.category && options.category !== 'All') {
      where.category = { equals: options.category, mode: 'insensitive' };
    }

    if (options.wingId) {
      where.wingId = options.wingId;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { category: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { wing: true },
      }),
    ]);

    return { total, items, page, limit };
  }

  async getResourceById(id: string) {
    return this.prisma.resource.findUnique({
      where: { id },
      include: { wing: true },
    });
  }

  async incrementDownloads(id: string) {
    return this.prisma.resource.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });
  }

  async createResource(data: {
    title: string;
    category: string;
    format: string;
    fileUrl?: string;
    wingId?: string;
    isMembersOnly?: boolean;
  }) {
    return this.prisma.resource.create({
      data,
    });
  }
}
