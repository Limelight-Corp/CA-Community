'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, WingRow } from '@ascend/ui';
import { useCommunityData } from '../../lib/useCommunityData';

export default function WingsPage() {
  const [openWing, setOpenWing] = useState<number | null>(null);
  const { data } = useCommunityData(true);
  const wings = (data.wings || []).filter((w) => w.isPublished !== false);

  return (
    <WebShell>
      {/* Page Header */}
      <section className="pt-[clamp(56px,8cqi,104px)] pb-[clamp(40px,5cqi,64px)] border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Wings</Eyebrow>
          <Heading level="h1" className="text-[clamp(42px,6cqi,76px)] mt-6 max-w-[15ch] leading-[1.03]">
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
      <section id="wings" className="py-12 pb-28 max-w-[1200px] mx-auto px-5 md:px-8 scroll-mt-24">
        <div className="border-t border-[var(--line)]">
          {wings.map((w) => (
            <WingRow
              key={w.id || w.number}
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
