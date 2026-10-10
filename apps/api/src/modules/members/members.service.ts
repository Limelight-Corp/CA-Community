import { MembersRepository } from './members.repository';
import { AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../errors/AppError';
import { decryptField } from '../../lib/crypto';

export class MembersService {
  constructor(
    private membersRepository: MembersRepository,
    private auditService: AuditService
  ) {}

  async getDirectory(options: {
    city?: string;
    specialization?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.membersRepository.listDirectory(options);

    // Mask sensitive fields for directory
    const sanitizedItems = result.items.map((m) => ({
      id: m.id,
      email: m.user.email,
      firmName: m.firmName,
      city: m.city,
      specialization: m.specialization,
      bio: m.bio,
      membershipType: m.membershipType,
      qualificationYear: m.qualificationYear,
      avatarUrl: m.avatarUrl,
      linkedinUrl: m.linkedinUrl,
      wings: m.wings.map((w) => ({
        id: w.wing.id,
        number: w.wing.number,
        name: w.wing.name,
        color: w.wing.color,
      })),
      memberSince: m.user.createdAt,
    }));

    return {
      ...result,
      items: sanitizedItems,
    };
  }

  async getMyProfile(userId: string) {
    const profile = await this.membersRepository.getMemberByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Member profile not found');
    }

    // Decrypt membership number for the authenticated owner
    let membershipNumber: string | null = null;
    if (profile.membershipNumberEncrypted) {
      membershipNumber = decryptField(profile.membershipNumberEncrypted);
    }

    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.user.email,
      mobile: profile.user.mobile,
      role: profile.user.role,
      membershipNumber,
      membershipType: profile.membershipType,
      qualificationYear: profile.qualificationYear,
      firmName: profile.firmName,
      city: profile.city,
      bio: profile.bio,
      specialization: profile.specialization,
      avatarUrl: profile.avatarUrl,
      linkedinUrl: profile.linkedinUrl,
      status: profile.status,
      validUntil: profile.validUntil,
      wings: profile.wings.map((w) => ({
        id: w.wing.id,
        number: w.wing.number,
        name: w.wing.name,
        color: w.wing.color,
      })),
      createdAt: profile.createdAt,
    };
  }

  async updateMyProfile(
    userId: string,
    data: {
      firmName?: string;
      city?: string;
      bio?: string;
      specialization?: string;
      linkedinUrl?: string;
      avatarUrl?: string;
    }
  ) {
    const existing = await this.membersRepository.getMemberByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Member profile not found');
    }

    // Defence in depth: copy only whitelisted scalar fields, whatever the caller passed.
    const allowed = ['firmName', 'city', 'bio', 'specialization', 'linkedinUrl', 'avatarUrl'] as const;
    const safe: Record<string, string> = {};
    for (const key of allowed) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string') safe[key] = value;
    }
    const updated = await this.membersRepository.updateProfile(userId, safe);

    await this.auditService.log({
      userId,
      action: 'member:profile_update',
      resource: 'MemberProfile',
      resourceId: updated.id,
      oldValues: existing,
      newValues: data,
    });

    return updated;
  }

  async approveMember(id: string, adminId: string) {
    const member = await this.membersRepository.getMemberById(id);
    if (!member) {
      throw new NotFoundError(`Member id "${id}" not found`);
    }

    const approved = await this.membersRepository.approveMember(id, adminId);

    await this.auditService.log({
      userId: adminId,
      action: 'member:approve',
      resource: 'MemberProfile',
      resourceId: member.id,
      oldValues: { status: member.status },
      newValues: { status: approved.status },
    });

    return approved;
  }
}
