import { ResourcesRepository } from './resources.repository';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';

export class ResourcesService {
  constructor(
    private resourcesRepository: ResourcesRepository,
    private auditService: AuditService
  ) {}

  async listResources(options: {
    category?: string;
    wingId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.resourcesRepository.listResources(options);
  }

  async downloadResource(id: string, isMember: boolean) {
    const resource = await this.resourcesRepository.getResourceById(id);
    if (!resource) {
      throw new NotFoundError(`Resource "${id}" not found`);
    }

    if (resource.isMembersOnly && !isMember) {
      throw new ForbiddenError('Membership required to download this resource');
    }

    const updated = await this.resourcesRepository.incrementDownloads(id);
    return {
      id: updated.id,
      title: updated.title,
      fileUrl: updated.fileUrl || `/downloads/${updated.id}.pdf`,
      downloads: updated.downloads,
    };
  }

  async createResource(data: any, adminId: string) {
    const resource = await this.resourcesRepository.createResource(data);

    await this.auditService.log({
      userId: adminId,
      action: 'resource:create',
      resource: 'Resource',
      resourceId: resource.id,
      newValues: data,
    });

    return resource;
  }
}
