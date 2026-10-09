'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, getInitials } from '@ascend/ui';
import { useCommunityData } from '../../lib/useCommunityData';

export default function SpeakersPage() {
  const router = useRouter();
  const { data } = useCommunityData(true);
  const speakers = (data.speakers || []).filter((s) => s.isPublished !== false);

  return (
    <WebShell>
      {/* Page Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Speakers</Eyebrow>
          <Heading level="h1" className="text-[clamp(42px,6cqi,76px)] mt-6 max-w-[15ch]">
            Learn from people{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
              doing the work.
            </em>
          </Heading>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="py-20 pb-28 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {speakers.map((s) => {
            const initials = getInitials(s.name);
            return (
              <button
                key={s.id || s.slug}
                onClick={() => router.push(`/speakers/${s.slug}`)}
                className="bg-transparent border-0 p-0 text-left cursor-pointer flex flex-col gap-3 group"
              >
                <div className="aspect-square rounded-[var(--r)] border border-[var(--line)] bg-[radial-gradient(90%_90%_at_80%_10%,rgb(var(--lime-rgb)/0.45),transparent_60%),linear-gradient(160deg,var(--brand-900),var(--brand-950))] grid place-items-center text-[var(--fg)] font-light text-[52px] md:text-[56px] tracking-tight group-hover:border-[rgb(var(--sky-rgb)/0.4)] transition-all overflow-hidden">
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <b className="block text-[17px] font-medium text-[var(--fg)] group-hover:text-[var(--lime-deep)] transition-colors">
                    {s.name}
                  </b>
                  <span className="block text-[13.5px] text-[var(--muted)] mt-0.5">
                    {s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </WebShell>
  );
}
