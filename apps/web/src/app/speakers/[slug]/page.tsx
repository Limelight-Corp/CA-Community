'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WebShell } from '../../../components/WebShell';
import {
  Heading,
  Eyebrow,
  EventCard,
  BackIcon,
  ArrowIcon,
  getInitials,
} from '@ascend/ui';
import {
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_EVENTS,
  PROTOTYPE_WINGS,
} from '@ascend/shared';

export default function SpeakerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params.slug as string) || 'nk';
  const speaker = PROTOTYPE_SPEAKERS[slug] || PROTOTYPE_SPEAKERS['nk']!;

  const speakerEvents = PROTOTYPE_EVENTS.filter((e) => e.speakerSlugs.includes(slug)).map((e) => {
    const wing = PROTOTYPE_WINGS.find((w) => w.number === e.wingNumber);
    return {
      id: e.slug,
      slug: e.slug,
      title: e.title,
      wingNumber: e.wingNumber,
      wingName: wing?.name || '',
      wingColor: wing?.color || 'var(--brand-500)',
      category: e.category,
      date: e.date,
      time: e.time,
      venue: e.venue,
      city: e.city,
      mode: e.mode,
      fee: e.fee,
      memberFee: e.memberFee,
      seatsTotal: e.seatsTotal,
      seatsTaken: e.seatsTaken,
    };
  });

  return (
    <WebShell>
      {/* Page Header */}
      <section className="py-14 md:py-20 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <button
            onClick={() => router.push('/speakers')}
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-white text-[14px] font-medium bg-transparent border-0 cursor-pointer p-0"
          >
            <BackIcon size={16} /> Speakers
          </button>

          <div className="flex gap-7 items-end flex-wrap mt-7">
            <div className="w-[132px] h-[132px] rounded-[var(--r)] border border-[var(--line)] bg-[linear-gradient(160deg,var(--brand-900),var(--brand-950))] grid place-items-center text-[var(--fg)] font-light text-[44px]">
              {getInitials(speaker.name)}
            </div>
            <div>
              <Heading level="h1" className="text-[clamp(34px,4.5cqi,56px)] m-0">
                {speaker.name}
              </Heading>
              <p className="text-[16px] text-[var(--muted)] mt-2">{speaker.title}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details & Sidebar */}
      <section className="py-14 pb-28 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-12 md:gap-20 items-start">
          {/* Main Info */}
          <div className="flex flex-col gap-14">
            <div className="flex flex-col gap-3">
              <Eyebrow>Bio</Eyebrow>
              <p className="text-[clamp(19px,2cqi,23px)] font-light leading-[1.5] text-[var(--fg)] max-w-[42ch]">
                {speaker.bio}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <Eyebrow>Speaking at</Eyebrow>
              {speakerEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {speakerEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onSelect={() => router.push(`/events/${ev.slug}`)}
                      onRegister={() => router.push(`/events/${ev.slug}/register`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[var(--muted)]">No upcoming sessions scheduled.</p>
              )}
            </div>
          </div>

          {/* Aside Sidebar */}
          <aside className="sticky top-24 border border-[var(--line)] bg-[linear-gradient(180deg,rgb(var(--mist-rgb)/0.05),rgb(var(--mist-rgb)/0.015)),var(--card)] rounded-[var(--r)] p-7 flex flex-col gap-5.5">
            <Eyebrow>Expertise</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {speaker.expertise.map((exp, idx) => (
                <span
                  key={idx}
                  className="py-1.5 px-3.5 rounded-full border border-[rgb(var(--mist-rgb)/0.14)] bg-[rgb(var(--mist-rgb)/0.04)] text-[13.5px] text-[var(--fg)] select-none"
                >
                  {exp}
                </span>
              ))}
            </div>

            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-full border border-[rgb(var(--mist-rgb)/0.16)] bg-[rgb(var(--mist-rgb)/0.04)] text-[var(--fg)] hover:border-[rgb(var(--mist-rgb)/0.4)] transition-colors text-[14px] font-medium"
            >
              LinkedIn profile <ArrowIcon size={16} />
            </a>
          </aside>
        </div>
      </section>
    </WebShell>
  );
}
