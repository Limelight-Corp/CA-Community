import { PrismaClient } from '@prisma/client';

export class ContentRepository {
  constructor(private prisma: PrismaClient) {}

  async getBlockByKey(key: string) {
    return this.prisma.contentBlock.findUnique({
      where: { key },
    });
  }

  async getBlocksBySection(section: string) {
    return this.prisma.contentBlock.findMany({
      where: { section },
    });
  }

  async getAllBlocks() {
    return this.prisma.contentBlock.findMany();
  }

  async upsertBlock(data: {
    key: string;
    section: string;
    title?: string;
    subtitle?: string;
    content: any;
    updatedBy?: string;
  }) {
    return this.prisma.contentBlock.upsert({
      where: { key: data.key },
      update: {
        section: data.section,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        updatedBy: data.updatedBy,
      },
      create: {
        key: data.key,
        section: data.section,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        updatedBy: data.updatedBy,
      },
    });
  }

  // News queries
  async listNews(page = 1, limit = 10, category?: string) {
    const skip = (page - 1) * limit;
    const where = category && category !== 'All' ? { category } : {};

    const [total, items] = await Promise.all([
      this.prisma.news.count({ where }),
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    return { total, items, page, limit };
  }

  async getNewsBySlug(slug: string) {
    return this.prisma.news.findUnique({
      where: { slug },
    });
  }

  async createNews(data: {
    slug: string;
    title: string;
    category: string;
    date: string;
    summary: string;
    content: string;
    author?: string;
    coverImageUrl?: string;
  }) {
    return this.prisma.news.create({
      data,
    });
  }
}
