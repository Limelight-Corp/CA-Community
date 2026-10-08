import { AuditRepository, CreateAuditLogData } from './audit.repository';

export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  async log(data: CreateAuditLogData) {
    try {
      await this.auditRepository.create(data);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async getLogs(page = 1, limit = 20) {
    return this.auditRepository.list(page, limit);
  }
}
