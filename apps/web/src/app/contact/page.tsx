import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Handshake,
  Mail,
  MapPin,
  Megaphone,
  Mic2,
  Phone,
  Plus,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import type { CommunityEvent, CommunityWing } from '@ascend/shared';
import { ORG_COMMUNITIES } from '@ascend/shared';
import { AccentText, Container, Kicker, cn } from '@ascend/ui';
import { Marquee, Reveal } from '../../components/ui-client';
import { getItems, getSettings } from '../../lib/community-store';
import { googleMapsEmbedUrl, safeUrl } from '../../lib/content';
import { PageHero } from '../../components/content/ui';
import { ContactForm } from '../../components/content/ContactForm';
import { CopyButton } from '../../components/content/CopyButton';
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from '../../components/site/SocialIcon';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Contact Us',
    description: `Get in touch with ${siteName} — questions about membership, events, partnerships or speaking. Send us a message and our team will respond.`,
    alternates: { canonical: '/contact' },
  };
}

/** Reasons to get in touch; each pre-fills the form subject. */
const TOPICS = [
  { key: 'membership', icon: UserPlus, title: 'Membership', text: 'Plans, eligibility and founding membership.', subject: 'Membership enquiry' },
  { key: 'events', icon: CalendarDays, title: 'Events & registrations', text: 'Bookings, receipts, seats and event details.', subject: 'Event registration query' },
  { key: 'partner', icon: Handshake, title: 'Partner or sponsor', text: 'Knowledge, technology, event and wing partners.', subject: 'Partnership / sponsorship' },
  { key: 'speak', icon: Mic2, title: 'Speak at a wing', text: 'Lead a session across our 10 professional wings.', subject: 'Speaking opportunity' },
  { key: 'city', icon: Building2, title: 'City chapters', text: 'City Leads, Young CA Leads and Women CA Leads.', subject: 'City chapter / community lead' },
  { key: 'media', icon: Megaphone, title: 'Media & general', text: 'Press, collaborations or anything else.', subject: 'General enquiry' },
] as const;

const FAQS = [
  {
    q: 'How do I register for an event?',
    a: 'Open any event on the Events page and press Register Now. Fill in a short form and you receive a booking ID with a printable pass straight away. Paid events show a payment step before confirmation.',
    href: '/events',
    cta: 'Browse events',
  },
  {
    q: 'How do I become a member?',
    a: 'Choose a plan on the Join Us page — Core (CA professionals), Associate (allied professionals) or Student — and submit the application. The team reviews every application and follows up with the next steps.',
    href: '/join',
    cta: 'See membership plans',
  },
  {
    q: 'Can my organisation partner with the community?',
    a: 'Yes. The partner ecosystem includes knowledge partners, technology partners, event partners, wing partners and annual strategic partners. Pick "Partner or sponsor" above and tell us what you have in mind.',
    href: '/contact?topic=partner#contact-form',
    cta: 'Start a partnership enquiry',
  },
  {
    q: 'I want to speak or run a session. Who do I talk to?',
    a: 'Each of the 10 professional wings runs year-round formats — from Tax Update Live to AI Audit Lab. Choose "Speak at a wing", mention your topic and the wing that fits best.',
    href: '/about#wings',
    cta: 'Explore the 10 wings',
  },
  {
    q: 'I lost my booking confirmation. What now?',
    a: 'Send us a message with the event name and the email you registered with, and we will help you retrieve your booking ID.',
    href: '/contact?topic=events#contact-form',
    cta: 'Ask about a booking',
  },
];

/** Deterministic angle/radius for a city on the radar, from its name. */
function radarPoint(name: string, i: number) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const angle = ((h % 360) + i * 47) % 360;
  const radius = 26 + (h % 18);
  const rad = (angle * Math.PI) / 180;
  return { left: 50 + Math.cos(rad) * radius, top: 50 + Math.sin(rad) * radius };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const activeTopic = TOPICS.find((t) => t.key === topic);
  const settings = getSettings();
  const { contact } = settings;
  const mapLink = safeUrl(contact.mapUrl);
  const mapEmbed = googleMapsEmbedUrl(contact.mapUrl, contact.address);
  const socials = (Object.entries(settings.social) as [SocialKey, string | undefined][])
    .map(([k, url]) => [k, safeUrl(url)] as const)
    .filter((entry): entry is readonly [SocialKey, string] => !!entry[1]);

  // Cities that actually host published offline events — the "Pan-India" radar is data-driven.
  const events = getItems<CommunityEvent>('events', true);
  const cities = [...new Set(events.filter((e) => e.mode === 'Offline' && e.city).map((e) => e.city.trim()))].slice(0, 8);
  const wingCount = getItems<CommunityWing>('wings', true).length;
  const partners = ORG_COMMUNITIES.find((c) => c.name.startsWith('Partners'));

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Say"
        accent="hello."
        lead="Questions about membership, events, partnerships or speaking at a wing session? Drop us a line — a real person will reply."
        ghost="HELLO"
      />

      {/* ------------------------------------------------------------ TOPIC PICKER */}
      <section className="relative py-16 md:py-20" aria-labelledby="topics-heading">
        <Container size="wide">
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Kicker tone="gold">Step 1 · Pick a topic</Kicker>
              <h2 id="topics-heading" className="mt-4 font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
                What&apos;s on your <AccentText tone="gold">mind?</AccentText>
              </h2>
            </div>
            <p className="max-w-[40ch] text-[15px] text-[var(--muted)]">Choose one and we&apos;ll pre-fill the form so your message reaches the right people.</p>
          </Reveal>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t, i) => {
              const active = activeTopic?.key === t.key;
              return (
                <Reveal as="li" key={t.key} delay={i * 60}>
                  <Link
                    href={`/contact?topic=${t.key}#contact-form`}
                    scroll={false}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'shine group relative flex h-full items-start gap-4 overflow-hidden rounded-[24px] border p-5 transition duration-500 hover:-translate-y-1',
                      active ? 'border-transparent bg-grad-primary' : 'border-mist/[0.1] bg-grad-surface hover:border-mist/[0.2]'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110',
                        active ? 'bg-white/15 text-white' : 'bg-brand-500/15 text-brand-200'
                      )}
                    >
                      <t.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block font-display text-[20px] font-medium tracking-[-0.02em]', active ? 'text-white' : 'text-[var(--fg)]')}>{t.title}</span>
                      <span className={cn('mt-1 block text-[13.5px] leading-snug', active ? 'text-white/80' : 'text-[var(--muted)]')}>{t.text}</span>
                    </span>
                    <ArrowUpRight
                      className={cn('h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-45', active ? 'text-white' : 'text-[var(--muted)] group-hover:text-gold')}
                      aria-hidden
                    />
                    <span aria-hidden className="pointer-events-none absolute -bottom-6 -right-1 font-display text-[96px] font-semibold leading-none tracking-[-0.06em] text-mist/[0.035]">
                      0{i + 1}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* ------------------------------------------------------------ CHANNELS + FORM */}
      <section className="relative pb-24" aria-labelledby="contact-form-heading">
        <div aria-hidden className="pointer-events-none absolute left-[-10%] top-20 h-[520px] w-[520px] rounded-full bg-brand-500/15 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-[-8%] h-[420px] w-[420px] rounded-full bg-gold/10 blur-[140px]" />
        <Container size="wide" className="relative grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Left: channels */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {contact.email && (
              <Reveal className="grain relative overflow-hidden rounded-[32px] border border-mist/[0.1] bg-grad-surface p-7 md:p-8">
                <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-[70px]" />
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-grad-gold text-brand-950 shadow-[0_16px_40px_-16px_rgb(var(--gold-rgb)/0.8)]">
                  <Mail className="h-6 w-6" aria-hidden />
                </span>
                <p className="relative mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Write to us</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="relative mt-2 block break-all font-display text-[clamp(26px,3.2vw,42px)] font-medium leading-[1.05] tracking-[-0.04em] text-[var(--fg)] transition hover:text-gold"
                >
                  {contact.email}
                </a>
                <div className="relative mt-6 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${contact.email}${activeTopic ? `?subject=${encodeURIComponent(activeTopic.subject)}` : ''}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-grad-primary px-4 text-[13px] font-semibold text-white transition hover:brightness-110"
                  >
                    Open mail app <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                  <CopyButton value={contact.email} label="Copy email" />
                </div>
              </Reveal>
            )}

            {(contact.phone || contact.address) && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {contact.phone && (
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="group flex items-center gap-4 rounded-[24px] border border-mist/[0.1] bg-grad-surface p-5 transition hover:border-gold/40">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                      <Phone className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Call</span>
                      <span className="block truncate font-display text-[18px] text-[var(--fg)]">{contact.phone}</span>
                    </span>
                  </a>
                )}
                {contact.address && (
                  <a
                    href={mapLink || '#'}
                    {...(mapLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center gap-4 rounded-[24px] border border-mist/[0.1] bg-grad-surface p-5 transition hover:border-gold/40"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Visit</span>
                      <span className="block font-display text-[15px] leading-snug text-[var(--fg)]">{contact.address}</span>
                    </span>
                  </a>
                )}
              </div>
            )}

            {mapEmbed ? (
              <div className="overflow-hidden rounded-[24px] border border-mist/[0.1]">
                <iframe
                  title={`Map${contact.address ? ` of ${contact.address}` : ''}`}
                  src={mapEmbed}
                  className="aspect-[4/3] w-full grayscale-[0.4] invert-[0.9] hue-rotate-180"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              /* Pan-India radar: cities that host our published events */
              <Reveal delay={80} className="relative overflow-hidden rounded-[32px] border border-mist/[0.1] bg-grad-surface p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Pan-India network</p>
                    <p className="mt-2 font-display text-[24px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">
                      {cities.length ? `Meeting in ${cities.length} cities` : 'A growing city network'}
                      {wingCount ? ` · ${wingCount} wings` : ''}
                    </p>
                  </div>
                  <span className="live-dot mt-2 shrink-0" aria-hidden />
                </div>
                <div className="relative mx-auto mt-6 aspect-square w-full max-w-[320px]" aria-hidden>
                  {[1, 0.72, 0.44].map((s) => (
                    <span key={s} className="absolute rounded-full border border-mist/[0.08]" style={{ inset: `${(1 - s) * 50}%` }} />
                  ))}
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-mist/[0.06]" />
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-mist/[0.06]" />
                  <span
                    className="spin-slow absolute inset-0 rounded-full"
                    style={{ background: 'conic-gradient(from 0deg, rgb(var(--gold-rgb) / 0.32), transparent 22%)', animationDuration: '6s' }}
                  />
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_var(--gold)]" />
                  {cities.map((city, i) => {
                    const p = radarPoint(city, i);
                    return (
                      <span key={city} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: `${p.left}%`, top: `${p.top}%` }}>
                        <span className="live-dot !bg-brand-300" />
                        <span className="whitespace-nowrap rounded-full bg-bg/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--fg)] backdrop-blur">
                          {city}
                        </span>
                      </span>
                    );
                  })}
                </div>
                {cities.length > 0 && <p className="sr-only">Event cities: {cities.join(', ')}</p>}
              </Reveal>
            )}

            {socials.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Follow along</h2>
                <ul className="flex flex-wrap gap-2">
                  {socials.map(([key, url]) => (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-mist/[0.14] px-4 py-2.5 text-[13.5px] text-[var(--fg)] transition hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                      >
                        <SocialIcon name={key} className="h-4 w-4" />
                        {SOCIAL_LABELS[key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: form */}
          <div id="contact-form" className="scroll-mt-28">
            <div className="shine relative overflow-hidden rounded-[36px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-8 md:p-12">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-[90px]" />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <Kicker>Step 2 · Send a message</Kicker>
                {activeTopic && (
                  <Link
                    href="/contact#contact-form"
                    scroll={false}
                    className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[12px] font-medium text-gold-soft hover:bg-gold/20"
                  >
                    <activeTopic.icon className="h-3.5 w-3.5" aria-hidden />
                    {activeTopic.title}
                    <span aria-hidden>×</span>
                    <span className="sr-only">clear topic</span>
                  </Link>
                )}
              </div>
              <h2
                id="contact-form-heading"
                className="relative mb-8 mt-5 font-display text-[clamp(34px,4.4vw,64px)] font-medium leading-[0.95] tracking-[-0.05em] text-[var(--fg)]"
              >
                How can we <AccentText>help?</AccentText>
              </h2>
              <div className="relative">
                <ContactForm key={activeTopic?.key ?? 'none'} defaultSubject={activeTopic?.subject ?? ''} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ GIANT MARQUEE */}
      <section aria-hidden className="relative -rotate-[1.5deg] border-y border-gold/25 bg-gradient-to-r from-brand-900 via-brand-950 to-brand-900 py-6">
        <Marquee duration={26} gap="2.5rem">
          {["Let's talk", 'Say hello', 'Partner with us', 'Speak at a wing', 'Host a city chapter', 'Join the community'].map((t, i) => (
            <span key={t} className="flex shrink-0 items-center gap-10 font-display text-[clamp(34px,5vw,72px)] font-medium tracking-[-0.045em]">
              <span className={i % 2 ? 'text-outline' : 'text-[var(--fg)]'}>{t}</span>
              <Sparkles className="h-7 w-7 text-gold" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section className="relative py-24 md:py-32" aria-labelledby="faq-heading">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Kicker>Quick answers</Kicker>
            <h2 id="faq-heading" className="mt-5 font-display text-[clamp(40px,5.6vw,84px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
              Before you <AccentText tone="gold">write.</AccentText>
            </h2>
            <p className="mt-6 max-w-[38ch] text-[16px] leading-relaxed text-[var(--muted)]">The questions we hear most — answered in one line, with a shortcut to the right page.</p>
          </Reveal>
          <ul className="flex flex-col gap-3">
            {FAQS.map((f, i) => (
              <Reveal as="li" key={f.q} delay={i * 60}>
                <details className="group rounded-[24px] border border-mist/[0.1] bg-grad-surface transition-colors open:border-gold/30 open:bg-gold/[0.04]">
                  <summary className="flex cursor-pointer list-none items-center gap-5 p-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 font-display text-[clamp(18px,1.8vw,23px)] font-medium tracking-[-0.02em] text-[var(--fg)]">{f.q}</span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] transition-transform duration-300 group-open:rotate-45 group-open:border-gold/50 group-open:text-gold">
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  </summary>
                  <div className="flex flex-col gap-4 px-6 pb-6 pl-[3.6rem]">
                    <p className="max-w-[62ch] text-[15px] leading-relaxed text-[var(--muted)]">{f.a}</p>
                    <Link href={f.href} className="group/link inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-white">
                      {f.cta}
                      <ArrowUpRight className="h-4 w-4 transition group-hover/link:rotate-45" aria-hidden />
                    </Link>
                  </div>
                </details>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ------------------------------------------------------------ PARTNER STRIP */}
      {partners && (
        <section className="relative px-5 pb-24 md:px-8 md:pb-32">
          <Reveal className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] border border-gold/20 bg-gradient-to-br from-brand-900 via-brand-950 to-bg p-8 md:p-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-[110px]" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <Kicker tone="gold">{partners.name}</Kicker>
                <h2 className="mt-5 font-display text-[clamp(36px,5vw,72px)] font-medium leading-[0.95] tracking-[-0.05em] text-white">
                  Build it <AccentText tone="gold">with us.</AccentText>
                </h2>
                <p className="mt-5 max-w-[44ch] text-[16px] leading-relaxed text-[var(--muted)]">
                  Bring your expertise, platform or brand to a Pan-India community of Chartered Accountants and allied professionals.
                </p>
                <Link
                  href="/contact?topic=partner#contact-form"
                  scroll={false}
                  className="group mt-8 inline-flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 transition hover:brightness-105"
                >
                  Start a partnership enquiry
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" aria-hidden />
                  </span>
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {partners.points.map((p, i) => (
                  <li
                    key={p}
                    className={cn(
                      'flex items-center gap-3 rounded-[20px] border border-mist/[0.1] bg-bg/40 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-gold/40',
                      i === partners.points.length - 1 && partners.points.length % 2 === 1 && 'sm:col-span-2'
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 font-mono text-[12px] text-gold">0{i + 1}</span>
                    <span className="font-display text-[17px] font-medium tracking-[-0.02em] text-[var(--fg)]">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
