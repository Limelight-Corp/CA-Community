'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, WingRow } from '@ascend/ui';
import { PROTOTYPE_WINGS } from '@ascend/shared';

export default function WingsPage() {
  const [openWing, setOpenWing] = useState<number | null>(null);

  return (
    <WebShell>
      {/* Page Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Wings</Eyebrow>
          <Heading level="h1" className="text-[clamp(42px,6cqi,76px)] mt-6 max-w-[15ch]">
            Ten wings.{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              One community.
            </em>
          </Heading>
          <p className="max-w-[52ch] text-[var(--muted)] text-[18px] leading-relaxed mt-6">
            Each wing runs a monthly format and one annual summit. Join as many as you like.
          </p>
        </div>
      </section>

      {/* Wings Full List */}
      <section className="py-16 pb-28 max-w-[1200px] mx-auto px-5 md:px-8">
        <div>
          {PROTOTYPE_WINGS.map((w) => (
            <WingRow
              key={w.number}
              number={w.number}
              name={w.name}
              color={w.color}
              tags={w.tags}
              activities={w.activities}
              isOpen={openWing === w.number}
              onToggle={() => setOpenWing(openWing === w.number ? null : w.number)}
            />
          ))}
        </div>
      </section>
    </WebShell>
  );
}
