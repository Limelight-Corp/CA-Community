'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@ascend/ui';
import type { MemberUser } from '../../context/AuthContext';

/** Signed-in member button in the header with a dropdown: dashboard and log out. */
export function UserMenu({ user, onLogout }: { user: MemberUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const firstName = user.name.replace(/^CA\s+/i, '').split(/\s+/)[0] || user.name;

  return (
    <div ref={root} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          'flex h-10 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13.5px] font-medium text-[var(--fg)] transition',
          open ? 'border-gold/50 bg-gold/[0.06]' : 'border-mist/[0.14] hover:border-mist/40'
        )}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-grad-primary font-mono text-[11.5px] font-semibold text-white ring-2 ring-gold/40">
          {user.initials}
        </span>
        <span className="max-w-[110px] truncate">{firstName}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[var(--muted)] transition-transform duration-300',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label="Account"
        className={cn(
          'glass-panel absolute right-0 top-[calc(100%+10px)] z-50 w-[260px] origin-top-right rounded-2xl p-2 shadow-[0_30px_60px_-25px_rgb(var(--black-rgb)/0.9)] transition-all duration-200',
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'
        )}
      >
        <div className="flex items-center gap-3 rounded-xl px-3 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-grad-primary font-mono text-[12.5px] font-semibold text-white">
            {user.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium text-[var(--fg)]">
              {user.name}
            </span>
            {(user.email || user.mobile) && (
              <span className="block truncate text-[12px] text-[var(--muted)]">
                {user.email || `+91 ${user.mobile}`}
              </span>
            )}
          </span>
        </div>
        <div className="my-1 h-px bg-mist/[0.08]" />
        <Link
          href="/dashboard"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-[var(--fg)] transition hover:bg-mist/[0.06]"
        >
          <LayoutDashboard className="h-4 w-4 text-brand-200" aria-hidden />
          My dashboard
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-bad transition hover:bg-bad/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </button>
      </div>
    </div>
  );
}
