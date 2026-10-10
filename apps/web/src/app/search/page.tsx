import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, Mic2, Newspaper, Search } from 'lucide-react';
import type { CommunityEvent, CommunityNews, CommunityResource, CommunitySpeaker } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker, cn, fieldInputClass } from '@ascend/ui';
import { getItems } from '../../lib/community-store';
import { formatEventDate, locationLabel } from '../../lib/events';
import { formatDisplayDate, safeUrl, truncate } from '../../lib/content';
import { openJobs } from '../../lib/jobs';
import { PagedList } from '../../components/content/PagedList';

type SP = Promise<Record<string, string | string[] | undefined>>;

function readQuery(sp: Record<string, string | string[] | undefined>) {
  const raw = sp.q;
  return (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '').trim().slice(0, 120);
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const q = readQuery(await searchParams);
  return {
    title: q ? `Search: ${q}` : 'Search',
    description: 'Search events, news, resources and speakers across the community website.',
    robots: { index: false, follow: true },
  };
}

/** Every whitespace-separated term must appear somewhere in the haystack. */
function matches(terms: string[], ...fields: (string | undefined | string[])[]) {
  const hay = fields.flat().filter(Boolean).join(' ').toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = readQuery(await searchParams);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const has = terms.length > 0;

  const events = has
    ? getItems<CommunityEvent>('events', true).filter((e) => matches(terms, e.title, e.description, e.city, e.venue, e.category, e.mode))
    : [];
  const news = has ? getItems<CommunityNews>('news', true).filter((n) => matches(terms, n.title, n.summary, n.content, n.category, n.author)) : [];
  const resources = has ? getItems<CommunityResource>('resources', true).filter((r) => matches(terms, r.title, r.category, r.format)) : [];
  const speakers = has
    ? getItems<CommunitySpeaker>('speakers', true).filter((s) => matches(terms, s.name, s.title, s.bio, s.organisation, s.qualification, s.expertise))
    : [];
  const jobs = has ? openJobs().filter((j) => matches(terms, j.title, j.organisation, j.type, j.location, j.description, j.experience, j.wing)) : [];
  const total = events.length + news.length + resources.length + speakers.length + jobs.length;

  const groups = [
    { id: 'events', label: 'Events', count: events.length, icon: CalendarDays },
    { id: 'news', label: 'News & articles', count: news.length, icon: Newspaper },
    { id: 'resources', label: 'Resources', count: resources.length, icon: FileText },
    { id: 'speakers', label: 'Speakers', count: speakers.length, icon: Mic2 },
    { id: 'careers', label: 'Careers', count: jobs.length, icon: BriefcaseBusiness },
  ];

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-[var(--line)] pb-12 pt-14 md:pb-16 md:pt-20">
        <div className="aurora opacity-60" aria-hidden>
          <i />
        </div>
        <Container size="wide" className="relative z-10 flex flex-col gap-8">
          <Kicker>Search</Kicker>
          <h1 className="font-display text-[clamp(42px,7.5vw,108px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
            {has ? (
              <>
                Results for <AccentText tone="gold">“{q}”</AccentText>
              </>
            ) : (
              <>
                Find <AccentText tone="gold">anything.</AccentText>
              </>
            )}
          </h1>
          <form action="/search" method="get" role="search" className="relative max-w-[720px]">
            <label htmlFor="site-search" className="sr-only">
              Search events, news, resources and speakers
            </label>
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Try “GST”, “AI”, “Mumbai” or a speaker’s name"
              className={cn(fieldInputClass, 'h-16 rounded-full pl-14 pr-36 text-[17px]')}
              maxLength={120}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 h-12 -translate-y-1/2 rounded-full bg-grad-primary px-6 text-[14.5px] font-semibold text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              Search
            </button>
          </form>
          {has && (
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <span className="mr-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
                {total} {total === 1 ? 'result' : 'results'}
              </span>
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px]',
                    g.count ? 'border-mist/[0.16] text-[var(--fg)] hover:border-gold/50' : 'pointer-events-none border-mist/[0.08] text-[var(--muted)] opacity-60'
                  )}
                  aria-disabled={g.count === 0 || undefined}
                >
                  <g.icon className="h-3.5 w-3.5" aria-hidden />
                  {g.label}
                  <span className="font-mono text-[11px] text-gold">{g.count}</span>
                </a>
              ))}
            </div>
          )}
        </Container>
      </section>

      <Container size="wide" className="flex flex-col gap-16 py-14 md:py-20">
        {!has && (
          <p className="text-[16px] text-[var(--muted)]">
            Search across events, news, resources and speakers. Or jump to{' '}
            <Link href="/events" className="text-brand-200 underline underline-offset-4">
              events
            </Link>
            ,{' '}
            <Link href="/resources" className="text-brand-200 underline underline-offset-4">
              resources
            </Link>{' '}
            or the{' '}
            <Link href="/about#wings" className="text-brand-200 underline underline-offset-4">
              wings
            </Link>
            .
          </p>
        )}

        {has && total === 0 && (
          <div className="rounded-[28px] border border-dashed border-mist/[0.14] p-10 text-center">
            <p className="font-display text-[26px] font-medium text-[var(--fg)]">Nothing matched “{q}”.</p>
            <p className="mt-2 text-[15px] text-[var(--muted)]">Try fewer or different words, or check the spelling.</p>
          </div>
        )}

        {events.length > 0 && (
          <ResultGroup id="events" title="Events" count={events.length}>
            {events.map((e) => (
              <ResultRow
                key={e.id}
                href={`/events/${e.slug}`}
                title={e.title}
                meta={`${formatEventDate(e)} · ${locationLabel(e)} · ${e.category}`}
                text={truncate(e.description, 170)}
              />
            ))}
          </ResultGroup>
        )}
        {news.length > 0 && (
          <ResultGroup id="news" title="News & articles" count={news.length}>
            {news.map((n) => (
              <ResultRow key={n.id} href={`/news/${n.slug}`} title={n.title} meta={`${formatDisplayDate(n.date)} · ${n.category}`} text={truncate(n.summary, 170)} />
            ))}
          </ResultGroup>
        )}
        {resources.length > 0 && (
          <ResultGroup id="resources" title="Resources" count={resources.length}>
            {resources.map((r) => (
              <ResultRow
                key={r.id}
                href="/resources"
                title={r.title}
                meta={`${r.category} · ${r.format}${r.isMembersOnly ? ' · Members only' : ''}`}
              />
            ))}
          </ResultGroup>
        )}
        {speakers.length > 0 && (
          <ResultGroup id="speakers" title="Speakers" count={speakers.length}>
            {speakers.map((s) => (
              <ResultRow
                key={s.id}
                href={`/speakers/${s.slug}`}
                title={s.name}
                meta={s.title}
                text={s.expertise.join(' · ')}
                media={<Avatar name={s.name} src={safeUrl(s.avatarUrl)} size={52} rounded="xl" />}
              />
            ))}
          </ResultGroup>
        )}
        {jobs.length > 0 && (
          <ResultGroup id="careers" title="Careers & articleship" count={jobs.length}>
            {jobs.map((j) => (
              <ResultRow key={j.id} href={`/careers/${j.slug}`} title={j.title} meta={`${j.organisation} · ${j.type} · ${j.location}`} text={truncate(j.description, 160)} />
            ))}
          </ResultGroup>
        )}
      </Container>
    </>
  );
}

function ResultGroup({ id, title, count, children }: { id: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="flex items-baseline gap-3 font-display text-[clamp(28px,3.4vw,44px)] font-medium tracking-[-0.04em] text-[var(--fg)]">
        {title} <span className="font-mono text-[14px] text-gold">{count}</span>
      </h2>
      <PagedList pageSize={8} noun={title.toLowerCase()} className="mt-6 border-t border-[var(--line)]">
        {children}
      </PagedList>
    </section>
  );
}

function ResultRow({ href, title, meta, text, media }: { href: string; title: string; meta?: string; text?: string; media?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-5 border-b border-[var(--line)] py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300">
        {media}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display text-[clamp(19px,2vw,24px)] font-medium tracking-[-0.03em] text-[var(--fg)] transition-transform duration-300 group-hover:translate-x-1.5">{title}</span>
          {meta && <span className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-[var(--muted)]">{meta}</span>}
          {text && <span className="text-[14.5px] text-[var(--muted)]">{text}</span>}
        </span>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-gold" aria-hidden />
      </Link>
    </li>
  );
}
