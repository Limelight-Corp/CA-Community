'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@ascend/ui';

/** Mobile-only bottom bar that slides away while the site footer is on screen. */
export function StickyRegisterBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setHidden(entries.some((e) => e.isIntersecting)));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-mist/[0.1] bg-bg/85 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-xl transition-transform duration-300 lg:hidden print:hidden',
        hidden ? 'invisible translate-y-full transition-[transform,visibility]' : 'visible'
      )}
    >
      {children}
    </div>
  );
}
