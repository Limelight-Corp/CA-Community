'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Compass,
  House,
  Images,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Mic2,
  Newspaper,
  Search,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn, useToast } from '@ascend/ui';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';

/**
 * Website Checklist §30 — recommended menu (all items appear in the mobile menu).
 * The desktop bar leaves out Home (the logo links home) and Join Us (the Join button), and uses
 * `short` labels, so it stays on one calm line.
 */
export const NAV_ITEMS: readonly { label: string; href: string; hint: string; icon: LucideIcon }[] =
  [
    { label: 'Home', href: '/', hint: 'Start here', icon: House },
    { label: 'About Us', href: '/about', hint: 'Vision, mission & leadership', icon: Info },
    { label: 'Our Wings', href: '/wings', hint: 'Ten professional wings', icon: Compass },
    {
      label: 'Events',
      href: '/events',
      hint: 'Seminars, workshops & summits',
      icon: CalendarDays,
    },
    { label: 'Speakers', href: '/speakers', hint: 'Experts & industry leaders', icon: Mic2 },
    { label: 'Resources', href: '/resources', hint: 'Guides, tax updates & learning', icon: BookOpen },
    { label: 'News & Updates', href: '/news', hint: 'Announcements & updates', icon: Newspaper },
    { label: 'Gallery', href: '/gallery', hint: 'Moments from our events', icon: Images },
    { label: 'Contact', href: '/contact', hint: 'Say hello', icon: Mail },
  ];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Logo({ siteName, compact, size = 'md' }: { siteName: string; compact?: boolean; size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label={`${siteName} by E Group — home`}>
      {/* E Group logo (public/brand/egroup-logo.png, 640×331) */}
      <Image src="/brand/egroup-logo.png" alt="" width={640} height={331} priority className={cn('w-auto shrink-0', size === 'lg' ? 'h-20' : 'h-12')} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-semibold tracking-[0.14em] text-[var(--fg)]">{siteName}</span>
          <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-brand-500">by E Group</span>
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({
  siteName,
  announcement,
}: {
  siteName: string;
  announcement?: string;
}) {
  const pathname = usePathname() || '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    toast('You have been logged out');
    if (pathname.startsWith('/dashboard')) router.push('/');
    else router.refresh();
  };

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
        <div className="relative z-50 overflow-hidden border-b border-gold/20 bg-brand-900">
          <Link
            href="/join"
            className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-5 py-2 text-center text-[12.5px] text-white/90 hover:text-white"
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
        <div className="mx-auto flex h-[76px] max-w-[1536px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="shrink-0">
            <Logo siteName={siteName} />
          </div>

          {/* Desktop menu: centred, with all exact items from Content Blueprint Section 1 */}
          <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 px-2 xl:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition-colors min-[1340px]:px-2.5 min-[1340px]:text-[12.5px] min-[1440px]:px-3 min-[1440px]:text-[13px]',
                    active ? 'text-brand-500 font-semibold' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                  )}
                >
                  {item.label}
                  {active && <span aria-hidden className="absolute inset-x-2 -bottom-0.5 h-px bg-brand-500 min-[1340px]:inset-x-2.5" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 xl:ml-0">
            <Link
              href="/search"
              aria-label="Search"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition hover:bg-mist/[0.06] hover:text-[var(--fg)]"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            {authLoading ? (
              // Keeps the slot while the session is checked, so "Log in" doesn't flash for signed-in members.
              <span className="hidden h-10 w-20 rounded-full bg-mist/[0.05] sm:block" aria-hidden />
            ) : user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 shrink-0 items-center whitespace-nowrap px-2.5 text-[13px] font-medium text-[var(--fg)] transition hover:text-brand-500 sm:flex"
                >
                  Log in
                </Link>
                <Link
                  href="/join"
                  className="hidden h-10 shrink-0 items-center whitespace-nowrap rounded-full border border-mist/[0.16] px-3.5 text-[13px] font-medium text-[var(--fg)] transition hover:border-mist/40 min-[1420px]:flex"
                >
                  Join the Community
                </Link>
              </>
            )}
            <Link
              href="/events"
              className="hidden h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-3.5 text-[13px] font-semibold text-white transition hover:bg-brand-600 md:flex"
            >
              Explore Events
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu panel */}
      <div
        className={cn(
          'fixed inset-0 z-[60] flex flex-col bg-bg/95 backdrop-blur-2xl transition-[opacity,visibility] duration-500 xl:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="aurora opacity-50" aria-hidden>
          <i />
        </div>
        <div className="relative flex h-[72px] shrink-0 items-center justify-between border-b border-mist/[0.08] px-5">
          <Logo siteName={siteName} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] transition hover:rotate-90 hover:border-gold/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <Link
            href="/join"
            className={cn(
              'mb-4 flex items-center gap-3 rounded-2xl border border-gold/25 bg-gold/[0.07] px-4 py-2.5 transition-all duration-500',
              open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            )}
          >
            <span className="live-dot shrink-0 !bg-gold" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                Launching 1 January 2027
              </span>
              <span className="block truncate text-[13.5px] text-[var(--fg)]">
                Founding member registrations are open
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          </Link>

          <span className="mb-2 px-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Menu
          </span>
          <nav aria-label="Mobile" className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item, i) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2 transition-all duration-500',
                    open ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0',
                    active
                      ? 'bg-gradient-to-r from-brand-500/25 via-brand-500/10 to-transparent'
                      : 'hover:bg-mist/[0.05]'
                  )}
                  style={{ transitionDelay: open ? `${60 + i * 30}ms` : '0ms' }}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold"
                    />
                  )}
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105',
                      active
                        ? 'border-transparent bg-grad-primary text-white'
                        : 'border-mist/[0.1] bg-mist/[0.04] text-brand-200'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block font-display text-[17px] font-medium leading-tight tracking-[-0.02em]',
                        active ? 'text-[var(--fg)]' : 'text-[var(--fg)]'
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">
                      {item.hint}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5',
                      active ? 'text-gold' : 'text-[var(--faint)]'
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/events"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-grad-primary px-3 text-[13px] font-semibold text-white"
              >
                <CalendarDays className="h-4 w-4" aria-hidden /> Explore Events
              </Link>
              <Link
                href="/join"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-grad-gold px-3 text-[13px] font-semibold text-[#2A1A0E]"
              >
                <UserPlus className="h-4 w-4" aria-hidden /> Join the Community
              </Link>
            </div>
            {user ? (
              <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl border border-mist/[0.12] bg-mist/[0.03] p-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grad-primary font-mono text-[11.5px] font-semibold text-white ring-2 ring-gold/40">
                  {user.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-[var(--fg)]">
                    {user.name}
                  </span>
                  {user.email && (
                    <span className="block truncate text-[11.5px] text-[var(--muted)]">
                      {user.email}
                    </span>
                  )}
                </span>
                <Link
                  href="/dashboard"
                  aria-label="Go to dashboard"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)]"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-bad/10 px-3 text-[12.5px] font-semibold text-bad"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="mt-2.5 flex h-11 items-center justify-center gap-2 rounded-full border border-mist/[0.14] text-[13.5px] font-medium text-[var(--fg)]"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Member log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
