'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, Search, X, User } from 'lucide-react';
import { cn } from '@ascend/ui';
import { useAuth } from '../../context/AuthContext';

/** Website Checklist §30 — recommended menu. */
export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Resources', href: '/resources' },
  { label: 'News & Updates', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Join Us', href: '/join' },
  { label: 'Contact', href: '/contact' },
] as const;

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Logo({ siteName, compact }: { siteName: string; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${siteName} home`}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 shadow-[0_8px_24px_-8px_rgb(var(--lime-rgb)/0.9)] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 19 L10 6 L14 13 L17 9 L21 19" />
        </svg>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]" />
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-[0.14em] text-[var(--fg)]">{siteName}</span>
      )}
    </Link>
  );
}

export function SiteHeader({ siteName, announcement }: { siteName: string; announcement?: string }) {
  const pathname = usePathname() || '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {announcement && (
        <div className="relative z-50 overflow-hidden border-b border-gold/20 bg-gradient-to-r from-brand-900 via-brand-950 to-brand-900">
          <Link
            href="/join"
            className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-5 py-2 text-center text-[12.5px] text-gold-soft hover:text-white"
          >
            <span className="live-dot shrink-0 !bg-gold" aria-hidden />
            <span className="truncate">{announcement}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        </div>
      )}

      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-500',
          scrolled
            ? 'border-b border-[var(--line)] bg-bg/75 backdrop-blur-xl backdrop-saturate-150'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-6 px-5 md:px-8">
          <Logo siteName={siteName} />

          <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-0.5 xl:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors',
                    active ? 'text-white' : 'text-[var(--muted)] hover:text-white'
                  )}
                >
                  {active && (
                    <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-mist/[0.08] ring-1 ring-mist/[0.12]" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition hover:bg-mist/[0.08] hover:text-white"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href={user ? '/dashboard' : '/login'}
              className="hidden h-10 items-center gap-2 rounded-full border border-mist/[0.14] px-4 text-[13.5px] font-medium text-[var(--fg)] transition hover:border-mist/40 sm:flex"
            >
              <User className="h-4 w-4" aria-hidden />
              {user ? 'Dashboard' : 'Log in'}
            </Link>
            <Link
              href="/events"
              className="group hidden h-10 items-center gap-2 rounded-full bg-grad-primary pl-4 pr-1.5 text-[13.5px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110 md:flex"
            >
              Register for an event
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] text-white xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <div
        className={cn(
          'fixed inset-0 z-[60] flex flex-col bg-bg/95 backdrop-blur-2xl transition-all duration-500 xl:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="aurora opacity-60" aria-hidden><i /></div>
        <div className="relative flex h-[72px] items-center justify-between px-5">
          <Logo siteName={siteName} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Mobile" className="relative flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-6 pb-6">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-baseline gap-4 border-b border-mist/[0.08] py-3 font-display text-[clamp(28px,8vw,44px)] font-medium tracking-[-0.03em] transition-all duration-500',
                open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                isActive(pathname, item.href) ? 'text-white' : 'text-[var(--muted)] hover:text-white'
              )}
              style={{ transitionDelay: open ? `${80 + i * 35}ms` : '0ms' }}
            >
              <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          ))}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/events" className="flex h-12 items-center justify-center rounded-full bg-grad-primary text-[14px] font-semibold text-white">
              Register for an event
            </Link>
            <Link href="/join" className="flex h-12 items-center justify-center rounded-full border border-gold/40 text-[14px] font-semibold text-gold-soft">
              Join the community
            </Link>
          </div>
          <Link href={user ? '/dashboard' : '/login'} className="mt-4 text-center text-[14px] text-[var(--muted)] underline underline-offset-4">
            {user ? 'Go to dashboard' : 'Member log in'}
          </Link>
        </nav>
      </div>
    </>
  );
}
