'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Avatar, cn } from '@ascend/ui';
import type { CommunityTestimonial } from '@ascend/shared';

interface TestimonialsSliderProps {
  testimonials: CommunityTestimonial[];
}

export function TestimonialsSlider({ testimonials }: TestimonialsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const total = testimonials.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchDeltaX.current = touch.clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    const threshold = 40; // minimum px swipe distance

    if (delta < -threshold) {
      // Swiped left -> next
      nextSlide();
    } else if (delta > threshold) {
      // Swiped right -> prev
      prevSlide();
    }

    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <div className="relative mt-10 md:mt-12" onKeyDown={handleKeyDown} tabIndex={0} aria-label="Member Testimonials Carousel">
      {/* ----------------- MOBILE SLIDER (< md) ----------------- */}
      <div className="block md:hidden">
        {/* Slider viewport */}
        <div
          className="relative overflow-hidden rounded-[28px] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((t, i) => (
              <div key={t.id || i} className="w-full shrink-0 px-1">
                <figure className="glass-panel flex min-h-[320px] w-full flex-col justify-between rounded-[26px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-7 shadow-lg shadow-black/5">
                  <div>
                    <div className="flex items-center justify-between">
                      <Quote className="h-8 w-8 text-gold opacity-90" aria-hidden />
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gold/80">
                        {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                      </span>
                    </div>
                    {/* Member Message */}
                    <blockquote className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-[var(--fg)]">
                      “{t.quote}”
                    </blockquote>
                  </div>

                  {/* Member Name, Profile & Avatar */}
                  <figcaption className="mt-6 flex items-center gap-3.5 border-t border-mist/[0.08] pt-4">
                    <Avatar name={t.name} src={t.photoUrl} size={46} className="ring-2 ring-gold/30 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-display text-[15.5px] font-semibold text-[var(--fg)] truncate">
                        {t.name}
                      </span>
                      {t.designation && (
                        <span className="block text-[12.5px] leading-snug text-[var(--muted)] line-clamp-2">
                          {t.designation}
                        </span>
                      )}
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Slider Controls: Arrows + Dots */}
        <div className="mt-6 flex items-center justify-between px-2">
          {/* Slide dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Testimonial slides">
            {testimonials.map((_, i) => {
              const active = i === currentIndex;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    active
                      ? 'w-7 bg-gradient-to-r from-gold to-amber-500'
                      : 'w-2 bg-mist/[0.25] hover:bg-mist/[0.45]'
                  )}
                />
              );
            })}
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous testimonial"
              className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] bg-[var(--bg)] text-[var(--fg)] shadow-sm transition hover:border-gold/50 hover:text-gold active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next testimonial"
              className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.14] bg-[var(--bg)] text-[var(--fg)] shadow-sm transition hover:border-gold/50 hover:text-gold active:scale-95"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- DESKTOP GRID (>= md) ----------------- */}
      <ul
        aria-label="Member testimonials grid"
        className={cn(
          'hidden md:grid gap-6',
          testimonials.length === 1
            ? 'max-w-[640px]'
            : testimonials.length === 2
              ? 'md:grid-cols-2'
              : 'md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {testimonials.map((t, i) => (
          <li key={t.id || i} className="flex h-full">
            <figure className="glass-panel flex w-full flex-col justify-between rounded-[28px] border border-mist/[0.08] p-7 transition duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.03]">
              <div>
                <Quote className="h-8 w-8 text-gold" aria-hidden />
                {/* Member Message */}
                <blockquote className="mt-4 text-[16px] leading-relaxed text-[var(--fg)]">
                  “{t.quote}”
                </blockquote>
              </div>
              {/* Member Name, Profile & Avatar */}
              <figcaption className="mt-6 flex items-center gap-3.5 border-t border-mist/[0.08] pt-5">
                <Avatar name={t.name} src={t.photoUrl} size={46} className="ring-2 ring-gold/30 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block font-display text-[16px] font-semibold text-[var(--fg)]">
                    {t.name}
                  </span>
                  {t.designation && (
                    <span className="block text-[13px] leading-snug text-[var(--muted)]">
                      {t.designation}
                    </span>
                  )}
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
