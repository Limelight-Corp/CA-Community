'use client';

import React from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, ImageIcon } from '@ascend/ui';

export default function AboutPage() {
  const leadership = [
    { name: 'CA Sandeep Garg', role: 'President', initials: 'SG' },
    { name: 'CA Abhinav Aggarwal', role: 'Vice President', initials: 'AA' },
    { name: 'To be announced', role: 'Secretary', initials: '' },
    { name: 'To be announced', role: 'Treasurer', initials: '' },
  ];

  const principles = [
    'Member first',
    'Value driven',
    'Inclusive community',
    'Future-ready',
    'Ethical & professional',
    'National & global',
  ];

  return (
    <WebShell>
      {/* Page Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>About</Eyebrow>
          <Heading level="h1" className="text-[clamp(42px,6cqi,76px)] mt-6 max-w-[15ch]">
            A stronger profession.{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              A brighter tomorrow.
            </em>
          </Heading>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 md:py-28 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          <div className="flex flex-col gap-4">
            <Eyebrow>Vision</Eyebrow>
            <p className="text-[clamp(21px,2.2cqi,27px)] font-light leading-[1.45] tracking-tight text-[var(--fg)]">
              One of India's most active professional communities for Chartered Accountants,
              built on connection, continuous learning and leadership.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Eyebrow>Mission</Eyebrow>
            <p className="text-[clamp(21px,2.2cqi,27px)] font-light leading-[1.45] tracking-tight text-[var(--fg)]">
              A platform where professionals{' '}
              <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
                learn, connect, grow, transform, thrive and contribute.
              </em>
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="pb-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="mb-14">
          <Eyebrow pill>Leadership</Eyebrow>
          <Heading level="h2" className="mt-4">
            Core team.
          </Heading>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {leadership.map((person, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <div className="aspect-[4/5] rounded-[var(--r)] border border-[var(--line)] bg-[linear-gradient(160deg,#0C1A58,#060A1F)] grid place-items-center text-[var(--fg)] font-light text-[42px] md:text-[48px] tracking-tight">
                {person.initials ? person.initials : <ImageIcon size={32} className="text-[var(--faint)]" />}
              </div>
              <div>
                <b className="block text-[15px] font-medium text-[var(--fg)]">{person.name}</b>
                <span className="block font-mono text-[12px] text-[var(--muted)]">{person.role}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[14.5px] text-[var(--muted)] mt-10 max-w-[60ch] leading-relaxed">
          The Executive Council includes the office-bearers and ten wing conveners. Each wing has a
          three-member committee and two young professional coordinators.
        </p>
      </section>

      {/* Principles Section */}
      <section className="pb-32 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="mb-14">
          <Eyebrow pill>Principles</Eyebrow>
          <Heading
            level="h2"
            style={{ fontSize: 'clamp(32px, 32.76px, 52px)' }}
            className="text-[clamp(32px,32.76px,52px)] mt-4"
          >
            How we decide.
          </Heading>
        </div>

        <div className="border-t border-[rgba(219,231,240,0.12)] w-full">
          {principles.map((pr, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[72px_1fr] sm:grid-cols-[96px_1fr] items-center py-7 sm:py-8 border-b border-[rgba(219,231,240,0.12)] transition-colors hover:bg-white/[0.015]"
            >
              <span className="font-mono text-[15px] sm:text-[16px] text-[#7F95C4]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h3
                style={{ fontSize: 'clamp(18px, 1.9cqi, 22px)' }}
                className="font-display text-[clamp(18px,1.9cqi,22px)] font-medium tracking-tight text-white"
              >
                {pr}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </WebShell>
  );
}
