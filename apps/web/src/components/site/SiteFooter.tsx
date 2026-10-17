import React from 'react';
import Link from 'next/link';
import { CookieSettingsLink } from './CookieConsent';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteSettings } from '@ascend/shared';
import { FOOTER_CONTENT } from '@ascend/shared';
import { Logo } from './SiteHeader';
import { SocialIcon, SOCIAL_LABELS, type SocialKey } from './SocialIcon';

const IMPORTANT_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Wings', href: '/wings' },
  { label: 'Events', href: '/events' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Resources', href: '/resources' },
];

const ABOUT_LINKS = [
  { label: 'Join Us', href: '/join' },
  { label: 'News & Updates', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
  { label: 'Leadership', href: '/about#leadership' },
];

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms & Conditions', href: '/legal/terms' },
  { label: 'Membership Terms', href: '/legal/membership-terms' },
  { label: 'Event Registration Terms', href: '/legal/event-terms' },
  { label: 'Cancellation & Refund Policy', href: '/legal/refund' },
  { label: 'Payment Terms', href: '/legal/payment' },
  /* { label: 'Cookie Policy', href: '/legal/cookies' }, */
];

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socials = (Object.entries(settings.social) as [SocialKey, string | undefined][]).filter(([, url]) => !!url);
  const { contact } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] bg-bg">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      {/* Giant wordmark */}
      <div className="relative mx-auto max-w-[1400px] px-5 pt-8 md:px-8 md:pt-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[clamp(32px,7vw,120px)] font-medium leading-[0.95] tracking-[-0.05em] text-[var(--fg)]">
            Learn. Connect.
            <br />
            Grow. <em className="font-serif font-normal italic text-gold-gradient">Contribute.</em>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="group flex h-14 w-full sm:w-auto items-center justify-between gap-6 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-[#2A1A0E] transition hover:brightness-105"
            >
              Join the community
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </Link>
            <Link
              href="/events"
              className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-mist/[0.18] px-6 text-[15px] font-semibold text-[var(--fg)] transition hover:border-mist/50"
            >
              Register for an event
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-8 px-5 py-12 sm:gap-10 sm:py-14 md:gap-12 md:py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Logo siteName={settings.siteName} size="lg" />
          <p className="max-w-[36ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
            {FOOTER_CONTENT.description}
          </p>
          <p className="font-mono text-[12px] tracking-[0.05em] text-gold font-medium">{FOOTER_CONTENT.brand}</p>
        </div>

        {/* On mobile screens, place Explore & Community side by side */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">
          <FooterColumn title="Explore" links={IMPORTANT_LINKS} />
          <FooterColumn title="Community" links={ABOUT_LINKS} />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">Get in touch</h3>
          <ul className="flex flex-col gap-3 text-[14.5px]">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 break-all text-[var(--fg)] hover:text-brand-200">
                  <Mail className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2.5 text-[var(--fg)] hover:text-brand-200">
                  <Phone className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
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

      <div className="relative border-t border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 sm:px-8 sm:pb-8 sm:pt-6">
          {/* Mobile view (< md): Clean, organized structure */}
          <div className="flex flex-col gap-6 md:hidden">
            {/* Legal Links section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                  Legal & Policies
                </span>
                <Link
                  href="/legal"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--muted)] transition-colors hover:text-gold"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <nav aria-label="Legal policies" className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                {LEGAL_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex min-h-[28px] items-center text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    {l.label}
                  </Link>
                ))}
                <CookieSettingsLink className="flex min-h-[28px] items-center text-left text-[12.5px] text-[var(--muted)] transition-colors hover:text-[var(--fg)]" />
              </nav>
            </div>

            {/* Copyright & Entity statement divider */}
            <div className="flex flex-col gap-1.5 border-t border-mist/[0.08] pt-4 text-[12px] text-[var(--muted)]">
              <p className="font-medium text-[var(--fg)]">
                © {year} EAGLE 2.0. All rights reserved.
              </p>
              <p className="font-mono text-[11px] text-gold/90">
                EAGLE 2.0 | नई सोच, नई उड़ान
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--muted)]/75">
                A professional community for Chartered Accountants, CA students and allied professionals.
              </p>
            </div>
          </div>

          {/* Desktop view (>= md): Sleek horizontal single-row layout */}
          <div className="hidden md:flex md:items-center md:justify-between md:gap-6 text-[12.5px] text-[var(--muted)]">
            <div className="flex items-center gap-3">
              <span>© {year} EAGLE 2.0. All rights reserved.</span>
              <span className="text-mist/[0.3]">•</span>
              <span className="font-mono text-[11px] text-gold">नई सोच, नई उड़ान</span>
            </div>
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="draw-underline hover:text-[var(--fg)]">
                  {l.label}
                </Link>
              ))}
              <CookieSettingsLink className="draw-underline text-left hover:text-[var(--fg)]" />
            </nav>
          </div>
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
            <Link href={l.href} className="draw-underline text-[14.5px] text-[var(--fg)] hover:text-brand-500">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
