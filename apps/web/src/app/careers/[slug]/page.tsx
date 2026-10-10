import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CalendarClock, Check, GraduationCap, IndianRupee, Layers, Lock, MapPin } from 'lucide-react';
import { ORG_WINGS, wingSlug } from '@ascend/shared';
import { Container, Kicker } from '@ascend/ui';
import { ShareButtons } from '../../../components/content/ShareButtons';
import { getSettings } from '../../../lib/community-store';
import { safeUrl, truncate } from '../../../lib/content';
import { applyTarget, employmentType, findJob, isJobOpen } from '../../../lib/jobs';
import { isApprovedMember } from '../../../lib/member-accounts';
import { currentMember } from '../../../lib/member-session';
import { jsonLd, siteUrl } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
type Params = Promise<{ slug: string }>;

const longDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = findJob(slug);
  if (!job) return { title: 'Opening not found' };
  return {
    title: `${job.title} — ${job.organisation}`,
    description: truncate(`${job.type} · ${job.location}. ${job.description}`, 160),
    alternates: { canonical: `/careers/${job.slug}` },
    ...(isJobOpen(job) ? {} : { robots: { index: false } }),
  };
}

export default async function JobPage({ params }: { params: Params }) {
  const { slug } = await params;
  const job = findJob(slug);
  if (!job) notFound();

  const open = isJobOpen(job);
  const account = await currentMember();
  const canSeeApply = !job.isMembersOnly || isApprovedMember(account);
  const apply = applyTarget(job);
  const logo = safeUrl(job.logoUrl);
  const url = `${siteUrl()}/careers/${job.slug}`;
  const wing = job.wing ? ORG_WINGS.find((w) => w.name === job.wing) : undefined;
  const paragraphs = job.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const remote = job.workMode === 'Remote';
  const jobLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: (job.createdAt ?? new Date().toISOString()).slice(0, 10),
    ...(job.deadline ? { validThrough: `${job.deadline}T23:59:59+05:30` } : {}),
    employmentType: employmentType(job.type),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.organisation,
      ...(logo ? { logo: logo.startsWith('/') ? `${siteUrl()}${logo}` : logo } : {}),
    },
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'India' } }
      : { jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' } } }),
    url,
  };

  const facts = [
    { icon: MapPin, label: 'Location', value: `${job.location} · ${job.workMode}` },
    { icon: GraduationCap, label: 'Eligibility', value: job.experience },
    { icon: IndianRupee, label: 'Stipend / salary', value: job.compensation },
    { icon: CalendarClock, label: 'Last date to apply', value: job.deadline ? longDate(job.deadline) : undefined },
  ].filter((f) => f.value);

  return (
    <>
      {open && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobLd) }} />}
      <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <Container size="wide" className="relative z-10 pb-10 pt-10 md:pt-14">
          <Link href="/careers" className="inline-flex items-center gap-2 text-[13.5px] text-[var(--muted)] hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All openings
          </Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={`${job.organisation} logo`} className="h-20 w-20 shrink-0 rounded-3xl bg-white object-contain p-2" />
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-brand-500/15 text-brand-200">
                <BriefcaseBusiness className="h-9 w-9" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Kicker tone="gold">{job.type}</Kicker>
                {!open && <span className="rounded-full border border-bad/30 bg-bad/10 px-3 py-1 text-[12px] font-semibold text-bad">Applications closed</span>}
              </div>
              <h1 className="mt-4 max-w-[24ch] text-balance font-display text-[clamp(32px,5vw,64px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
                {job.title}
              </h1>
              <p className="mt-3 text-[17px] text-[var(--fg-soft)]">{job.organisation}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <h2 className="font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">About the role</h2>
            <div className="mt-4 flex flex-col gap-4 text-[16px] leading-relaxed text-[var(--fg-soft)]">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {!!job.requirements?.length && (
              <>
                <h2 className="mt-10 font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">Requirements</h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-[var(--fg-soft)]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-ok" aria-hidden /> {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-10">
              <ShareButtons url={url} title={`${job.title} — ${job.organisation}`} />
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[26px] border border-mist/[0.1] bg-grad-surface p-6">
              <ul className="flex flex-col gap-4">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span>
                      <span className="block text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</span>
                      <span className="block text-[15px] text-[var(--fg)]">{value}</span>
                    </span>
                  </li>
                ))}
                {wing && (
                  <li className="flex items-start gap-3">
                    <Layers className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span>
                      <span className="block text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">Wing</span>
                      <Link href={`/wings/${wingSlug(wing.name)}`} className="block text-[15px] text-[var(--fg)] hover:text-gold">
                        {wing.name}
                      </Link>
                    </span>
                  </li>
                )}
              </ul>

              <div className="mt-6 border-t border-[var(--line)] pt-6">
                {!open ? (
                  <p className="text-[14px] text-[var(--muted)]">This opening is no longer accepting applications.</p>
                ) : !canSeeApply ? (
                  <div className="flex flex-col gap-3">
                    <p className="flex items-start gap-2 text-[14px] text-[var(--fg)]">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden /> How to apply is shared with members.
                    </p>
                    {!account && (
                      <Link href={`/login?next=${encodeURIComponent(`/careers/${job.slug}`)}`} className="inline-flex h-11 items-center justify-center rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white">
                        Log in
                      </Link>
                    )}
                    <Link href="/join" className="inline-flex h-11 items-center justify-center rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950">
                      Become a member
                    </Link>
                  </div>
                ) : apply ? (
                  <a
                    href={apply.href}
                    {...(apply.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-grad-primary px-5 text-center text-[14.5px] font-semibold text-white"
                  >
                    {apply.label} <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <p className="text-[14px] text-[var(--muted)]">
                    Application details will be added soon. <Link href="/contact" className="text-[var(--fg)] underline underline-offset-2">Contact us</Link> meanwhile.
                  </p>
                )}
              </div>
            </div>
            <p className="px-2 text-[12px] leading-relaxed text-[var(--muted)]">
              Openings are shared by firms and members. Apply directly with the organisation; {getSettings().siteName} is not part of the hiring process.
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}
