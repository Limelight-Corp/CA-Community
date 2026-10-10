/** Job board helpers (server only). */
import type { CommunityJob } from '@ascend/shared';
import { getItems } from './community-store';
import { safeUrl } from './content';

/** Today's date (YYYY-MM-DD) in India time — deadlines are inclusive. */
function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

export function isJobOpen(j: Pick<CommunityJob, 'deadline'>, today = todayIST()): boolean {
  return !j.deadline || j.deadline >= today;
}

/** Published openings that haven't passed their last date: featured first, then newest. */
export function openJobs(): CommunityJob[] {
  const today = todayIST();
  return getItems<CommunityJob>('jobs', true)
    .filter((j) => isJobOpen(j, today))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/** A published opening by slug (also after its deadline, so shared links still explain it closed). */
export function findJob(slug: string): CommunityJob | undefined {
  return getItems<CommunityJob>('jobs', true).find((j) => j.slug === slug);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where to apply: an https link, else a mailto with the role in the subject. */
export function applyTarget(j: CommunityJob): { href: string; label: string } | null {
  const url = safeUrl(j.applyUrl);
  if (url && /^https?:/i.test(url)) return { href: url, label: 'Apply on the firm’s website' };
  const email = j.applyEmail?.trim();
  if (email && EMAIL.test(email)) {
    const subject = encodeURIComponent(`Application: ${j.title}`);
    return { href: `mailto:${email}?subject=${subject}`, label: `Apply by email (${email})` };
  }
  return null;
}

/** schema.org employmentType for a job type. */
export function employmentType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('full')) return 'FULL_TIME';
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('intern') || t.includes('articleship') || t.includes('training')) return 'INTERN';
  if (t.includes('contract') || t.includes('freelance')) return 'CONTRACTOR';
  return 'OTHER';
}
