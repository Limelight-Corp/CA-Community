import { ContentRepository } from './content.repository';
import { AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../errors/AppError';

export class ContentService {
  constructor(
    private contentRepository: ContentRepository,
    private auditService: AuditService
  ) {}

  async getBlock(key: string) {
    const block = await this.contentRepository.getBlockByKey(key);
    if (!block) throw new NotFoundError(`Content block "${key}" not found`);
    return block;
  }

  async getSection(section: string) {
    return this.contentRepository.getBlocksBySection(section);
  }

  async getAllBlocks() {
    return this.contentRepository.getAllBlocks();
  }

  async updateBlock(
    data: {
      key: string;
      section: string;
      title?: string;
      subtitle?: string;
      content: any;
    },
    updatedBy: string
  ) {
    const existing = await this.contentRepository.getBlockByKey(data.key);

    const updated = await this.contentRepository.upsertBlock({
      ...data,
      updatedBy,
    });

    await this.auditService.log({
      userId: updatedBy,
      action: 'content:update',
      resource: 'ContentBlock',
      resourceId: updated.id,
      oldValues: existing?.content,
      newValues: data.content,
    });

    return updated;
  }

  async listNews(page = 1, limit = 10, category?: string) {
    return this.contentRepository.listNews(page, limit, category);
  }

  async getNewsBySlug(slug: string) {
    const item = await this.contentRepository.getNewsBySlug(slug);
    if (!item) throw new NotFoundError(`News article "${slug}" not found`);
    return item;
  }

  async createNews(data: any, adminId: string) {
    const item = await this.contentRepository.createNews(data);

    await this.auditService.log({
      userId: adminId,
      action: 'news:create',
      resource: 'News',
      resourceId: item.id,
      newValues: data,
    });

    return item;
  }
}
