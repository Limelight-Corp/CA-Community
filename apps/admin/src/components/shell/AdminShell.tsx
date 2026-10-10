'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  Images,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Activity,
  Layers,
  Menu,
  Megaphone,
  Mic2,
  Newspaper,
  Quote,
  ScanLine,
  Settings,
  Sparkles,
  BriefcaseBusiness,
  Ticket,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ToastProvider, cn } from '@ascend/ui';

export interface ShellCounts {
  pendingMembers: number;
  unreadMessages: number;
  pendingPayments: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: keyof ShellCounts;
}

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: Activity },
    ],
  },
  {
    heading: 'Events',
    items: [
      { href: '/events', label: 'Events', icon: CalendarDays },
      { href: '/registrations', label: 'Registrations', icon: Ticket },
      { href: '/checkin', label: 'Check-in scanner', icon: ScanLine },
      { href: '/payments', label: 'Payments', icon: CreditCard, badge: 'pendingPayments' },
    ],
  },
  {
    heading: 'Community',
    items: [
      { href: '/members', label: 'Members', icon: UserCheck, badge: 'pendingMembers' },
      { href: '/messages', label: 'Messages', icon: Inbox, badge: 'unreadMessages' },
    ],
  },
  {
    heading: 'Website content',
    items: [
      { href: '/content/news', label: 'News & Updates', icon: Newspaper },
      { href: '/content/resources', label: 'Knowledge Hub', icon: BookOpen },
      { href: '/content/gallery', label: 'Gallery', icon: Images },
      { href: '/content/speakers', label: 'Speakers', icon: Mic2 },
      { href: '/content/team', label: 'Team Profiles', icon: Users },
      { href: '/content/testimonials', label: 'Testimonials', icon: Quote },
      { href: '/content/initiatives', label: 'Initiatives', icon: Sparkles },
      { href: '/content/jobs', label: 'Jobs & articleship', icon: BriefcaseBusiness },
      { href: '/content/wings', label: 'Wings', icon: Layers },
    ],
  },
  {
    heading: 'Site',
    items: [
      { href: '/settings', label: 'Site Settings', icon: Settings },
      { href: '/settings#announcement', label: 'Announcement bar', icon: Megaphone },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  const base = href.split('#')[0]!;
  if (href.includes('#')) return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-grad-primary font-display text-[18px] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(var(--lime-rgb)/0.9)]">
        A
      </span>
      <span className="leading-tight">
        <b className="block font-display text-[16px] font-semibold tracking-[0.14em] text-[var(--fg)]">ASCEND</b>
        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-gold">Admin console</span>
      </span>
    </Link>
  );
}

export interface ShellAdmin {
  name: string;
  role: 'super_admin' | 'admin';
}

function AccountBar({ admin }: { admin: ShellAdmin | null }) {
  const [busy, setBusy] = useState(false);
  if (!admin) {
    return <p className="text-[11.5px] leading-relaxed text-faint">Development mode · access gate is disabled on this machine.</p>;
  }
  const logout = async () => {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => null);
    window.location.assign('/login');
  };
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grad-primary font-mono text-[12px] font-semibold uppercase text-white ring-2 ring-gold/40">
        {admin.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13.5px] font-medium text-[var(--fg)]">{admin.name}</span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {admin.role === 'super_admin' ? 'Super admin' : 'Administrator'}
        </span>
      </span>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-bad/25 bg-bad/10 px-3 text-[12.5px] font-semibold text-bad transition hover:bg-bad/20 disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
        Log out
      </button>
    </div>
  );
}

function NavList({ counts, pathname, onNavigate }: { counts: ShellCounts; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-6">
      {NAV.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <p className="px-3 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-faint">{group.heading}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const count = item.badge ? counts[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition',
                      active
                        ? 'bg-brand-500/15 text-[var(--fg)] shadow-[inset_0_0_0_1px_rgb(var(--brand-300-rgb)/0.25)]'
                        : 'text-[var(--muted)] hover:bg-mist/[0.05] hover:text-[var(--fg)]'
                    )}
                  >
                    {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gold" />}
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand-200' : 'text-faint group-hover:text-brand-200')} />
                    <span className="truncate">{item.label}</span>
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-gold">
                        {count}
                        <span className="sr-only"> pending</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ counts, admin, children }: { counts: ShellCounts; admin: ShellAdmin | null; children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="relative min-h-screen bg-bg">
        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-brand-500/[0.10] blur-[120px]" />
          <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-gold/[0.05] blur-[120px]" />
        </div>

        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-mist/[0.08] bg-panel/80 backdrop-blur-xl lg:flex">
          <div className="px-5 pb-6 pt-6">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-8">
            <NavList counts={counts} pathname={pathname} />
          </div>
          <div className="border-t border-mist/[0.08] px-4 py-4">
            <AccountBar admin={admin} />
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-mist/[0.08] bg-panel/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Brand />
          <button
            ref={menuRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            className="grid h-10 w-10 place-items-center rounded-xl border border-mist/[0.12] text-[var(--fg)]"
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open navigation</span>
          </button>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation" id="admin-mobile-nav">
            <button
              type="button"
              aria-label="Close navigation"
              tabIndex={-1}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col border-r border-mist/[0.1] bg-panel shadow-2xl">
              <div className="flex items-center justify-between px-4 pb-5 pt-4">
                <Brand />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-mist/[0.12] text-[var(--fg)]"
                >
                  <X className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Close navigation</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-8">
                <NavList counts={counts} pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>
              <div className="border-t border-mist/[0.08] px-4 py-4">
                <AccountBar admin={admin} />
              </div>
            </div>
          </div>
        )}

        <main id="main" className="relative lg:pl-[264px]">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-4 py-7 sm:px-6 md:py-10 lg:px-10">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
