import React from 'react';
import Link from 'next/link';
import { CookieSettingsLink } from './CookieConsent';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteSettings } from '@ascend/shared';
import { ORG_POSITIONING } from '@ascend/shared';
import { Logo } from './SiteHeader';
import { SocialIcon, SOCIAL_LABELS, type SocialKey } from './SocialIcon';

const IMPORTANT_LINKS = [
  { label: 'Upcoming Events', href: '/events' },
  { label: 'Join the Community', href: '/join' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Resources', href: '/resources' },
  { label: 'News & Updates', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Careers & Articleship', href: '/careers' },
  { label: 'Mentorship', href: '/mentorship' },
];

const ABOUT_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Leadership', href: '/about#leadership' },
  { label: 'Wings', href: '/wings' },
  { label: 'Membership Plans', href: '/join#plans' },
  { label: 'Contact', href: '/contact' },
];

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms & Conditions', href: '/legal/terms' },
  { label: 'Event Registration Terms', href: '/legal/event-terms' },
  { label: 'Cancellation & Refund', href: '/legal/refund' },
  { label: 'Payment Terms', href: '/legal/payment' },
  { label: 'Cookie Policy', href: '/legal/cookies' },
];

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socials = (Object.entries(settings.social) as [SocialKey, string | undefined][]).filter(([, url]) => !!url);
  const { contact } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] bg-bg">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      {/* Giant wordmark */}
      <div className="relative mx-auto max-w-[1400px] px-5 pt-20 md:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[clamp(44px,8vw,120px)] font-medium leading-[0.9] tracking-[-0.05em] text-[var(--fg)]">
            Learn. Connect.
            <br />
            Grow. <em className="font-serif font-normal italic text-gold-gradient">Contribute.</em>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="group flex h-14 items-center justify-between gap-6 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 transition hover:brightness-105"
            >
              Join the community
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </Link>
            <Link
              href="/events"
              className="flex h-14 items-center justify-center rounded-full border border-mist/[0.18] px-6 text-[15px] font-semibold text-[var(--fg)] transition hover:border-mist/50"
            >
              Register for an event
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-2 md:px-8 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Logo siteName={settings.siteName} />
          <p className="max-w-[36ch] text-[14.5px] leading-relaxed text-[var(--muted)]">{settings.tagline}</p>
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-gold">Launch · {ORG_POSITIONING.launchLabel}</p>
        </div>

        <FooterColumn title="Explore" links={IMPORTANT_LINKS} />
        <FooterColumn title="Community" links={ABOUT_LINKS} />

        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">Get in touch</h3>
          <ul className="flex flex-col gap-3 text-[14.5px]">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-[var(--fg)] hover:text-brand-200">
                  <Mail className="h-4 w-4 text-brand-200" aria-hidden />
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2.5 text-[var(--fg)] hover:text-brand-200">
                  <Phone className="h-4 w-4 text-brand-200" aria-hidden />
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-2.5 text-[var(--muted)]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden />
                <span>{contact.address}</span>
              </li>
            )}
            {!contact.email && !contact.phone && !contact.address && (
              <li>
                <Link href="/contact" className="text-[var(--fg)] hover:text-brand-200">
                  Contact form →
                </Link>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Social media">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[key]}
                    className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] transition hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                  >
                    <SocialIcon name={key} className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-6 text-[12.5px] text-[var(--muted)] md:flex-row md:items-center md:justify-between md:px-8">
          <span>
            © {year} {settings.siteName}. All rights reserved.
          </span>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="draw-underline hover:text-[var(--fg)]">
                {l.label}
              </Link>
            ))}
            <CookieSettingsLink className="draw-underline text-left hover:text-[var(--fg)]" />
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="draw-underline text-[14.5px] text-[var(--fg)] hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
