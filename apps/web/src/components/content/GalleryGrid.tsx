'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, MapPin, Play, X } from 'lucide-react';
import { EmptyState, cn } from '@ascend/ui';
import { chipClass } from './ui';

export interface GalleryCardData {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  image?: string;
  /** Embeddable player URL (YouTube/Vimeo). */
  embedUrl?: string;
  /** Raw video link when it cannot be embedded. */
  videoUrl?: string;
  gradient: string;
}

/** Bento rhythm: some tiles span two columns / rows for a magazine feel. */
const SPANS = ['sm:col-span-2 sm:row-span-2', '', 'sm:row-span-2', '', 'sm:col-span-2', '', '', 'sm:row-span-2'];

export function GalleryGrid({ items, categories }: { items: GalleryCardData[]; categories: string[] }) {
  const [active, setActive] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => (active === 'All' ? items : items.filter((g) => g.category.toLowerCase() === active.toLowerCase())),
    [items, active]
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    requestAnimationFrame(() => lastTrigger.current?.focus());
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Filter gallery by category">
        <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {['All', ...categories].map((c) => (
            <button key={c} type="button" aria-pressed={active === c} onClick={() => setActive(c)} className={chipClass(active === c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} items shown
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<Images />} title="No moments here yet" description="Photos and videos will appear after our first events." />
      ) : (
        <ul className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((g, i) => {
            const hasMedia = !!(g.image || g.embedUrl);
            const isVideo = !!(g.embedUrl || g.videoUrl);
            const inner = (
              <>
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image} alt={g.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                ) : (
                  <div className="grain absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]" style={{ background: g.gradient }} aria-hidden />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" aria-hidden />
                {isVideo && (
                  <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform duration-500 group-hover:scale-110" aria-hidden>
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-left">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold-soft">{g.category}</span>
                  <span className="font-display text-[clamp(18px,1.8vw,24px)] font-medium leading-tight tracking-[-0.03em] text-white">{g.title}</span>
                  <span className="flex items-center gap-1.5 text-[12.5px] text-white/70">
                    {g.location && <MapPin className="h-3.5 w-3.5" aria-hidden />}
                    {[g.location, g.date].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </>
            );
            const tileClass = cn('group relative block h-full w-full overflow-hidden rounded-[24px] border border-mist/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold');
            return (
              <li key={g.id} className={cn(SPANS[i % SPANS.length])}>
                {hasMedia ? (
                  <button
                    type="button"
                    className={tileClass}
                    onClick={(e) => {
                      lastTrigger.current = e.currentTarget;
                      setOpenIndex(i);
                    }}
                    aria-label={`${isVideo ? 'Play video' : 'View photo'}: ${g.title}`}
                  >
                    {inner}
                  </button>
                ) : g.videoUrl ? (
                  <a href={g.videoUrl} target="_blank" rel="noopener noreferrer" className={tileClass} aria-label={`Watch video: ${g.title} (opens in a new tab)`}>
                    {inner}
                  </a>
                ) : (
                  <div className={tileClass}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {openIndex !== null && visible[openIndex] && (
        <Lightbox
          items={visible}
          index={openIndex}
          onIndex={setOpenIndex}
          onClose={close}
        />
      )}
    </div>
  );
}

function Lightbox({ items, index, onIndex, onClose }: { items: GalleryCardData[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const media = items.map((g, i) => ({ g, i })).filter(({ g }) => g.image || g.embedUrl);
  const pos = media.findIndex((m) => m.i === index);
  const item = items[index]!;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (media.length < 2) return;
      const next = media[(pos + dir + media.length) % media.length];
      if (next) onIndex(next.i);
    },
    [media, pos, onIndex]
  );

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, iframe, a[href]');
        if (!f.length) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const navBtn = 'grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
          {pos + 1} / {media.length}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className={navBtn} aria-label="Close (Esc)">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {item.embedUrl ? (
          <iframe
            key={item.id}
            src={item.embedUrl}
            title={item.title}
            className="aspect-video w-full max-w-[1100px] rounded-[20px] border border-white/10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.id} src={item.image} alt={item.title} className="max-h-full max-w-full rounded-[20px] object-contain" />
        )}
        {media.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} className={cn(navBtn, 'absolute left-3 top-1/2 -translate-y-1/2 md:left-6')} aria-label="Previous">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => step(1)} className={cn(navBtn, 'absolute right-3 top-1/2 -translate-y-1/2 md:right-6')} aria-label="Next">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>
      <div className="px-5 py-5 text-center md:px-8">
        <p className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">{item.title}</p>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">{[item.category, item.location, item.date].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  );
}
