'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, EventCard, Input, Select } from '@ascend/ui';
import { PROTOTYPE_EVENTS, PROTOTYPE_WINGS } from '@ascend/shared';

export default function EventsPage() {
  const router = useRouter();
  const [modeFilter, setModeFilter] = useState<'All' | 'Online' | 'Offline'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [wingFilter, setWingFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Career'];

  const filteredEvents = PROTOTYPE_EVENTS.filter((event) => {
    const matchesMode = modeFilter === 'All' || event.mode === modeFilter;
    const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
    const matchesWing = wingFilter === 'All' || String(event.wingNumber) === wingFilter;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMode && matchesCategory && matchesWing && matchesSearch;
  });

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Calendar 2027</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Upcoming{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              events.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Pan-India summits, technical clinics, speed networking evenings, and hands-on automation labs.
          </p>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <section className="py-8 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
          {/* Format Mode Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Online', 'Offline'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-4 py-1.5 rounded-[var(--r-full)] text-[13px] font-medium transition-all ${
                  modeFilter === mode
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
                }`}
              >
                {mode === 'All' ? 'All Formats' : mode}
              </button>
            ))}
          </div>

          {/* Wing & Category & Search inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categories.map((c) => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={wingFilter}
                onChange={(e) => setWingFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Ten Wings' },
                  ...PROTOTYPE_WINGS.map((w) => ({
                    value: String(w.number),
                    label: `Wing ${w.number}: ${w.name.split('&')[0]}`,
                  })),
                ]}
              />
            </div>

            <div className="w-full sm:w-56">
              <Input
                placeholder="Search events or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8">
            <h3 className="font-display text-[20px] font-medium text-[var(--fg)] mb-2">
              No matching events found
            </h3>
            <p className="text-[14.5px] text-[var(--muted)] mb-6">
              Try adjusting your format or category filters to discover other scheduled sessions.
            </p>
            <button
              onClick={() => {
                setModeFilter('All');
                setCategoryFilter('All');
                setWingFilter('All');
                setSearchQuery('');
              }}
              className="text-[13px] font-mono text-[var(--accent)] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const wing = PROTOTYPE_WINGS.find((w) => w.number === evt.wingNumber);
              const isSoldOut = evt.seatsTaken >= evt.seatsTotal;

              const eventCardData = {
                id: evt.slug,
                slug: evt.slug,
                title: evt.title,
                category: evt.category,
                date: evt.date,
                time: evt.time,
                venue: evt.venue,
                city: evt.city,
                mode: evt.mode,
                fee: evt.fee,
                memberFee: evt.memberFee,
                seatsTotal: evt.seatsTotal,
                seatsTaken: evt.seatsTaken,
                wingNumber: evt.wingNumber,
                wingName: wing?.name || 'General',
                wingColor: wing?.color || '#2F6FE4',
              };

              return (
                <div key={evt.slug} className="flex flex-col">
                  <EventCard
                    event={eventCardData}
                    onSelect={() => router.push(`/events/${evt.slug}`)}
                    onRegister={() => router.push(`/events/${evt.slug}/register`)}
                  />
                  {isSoldOut && (
                    <div className="mt-2 text-center text-[12px] font-mono text-[var(--danger)]">
                      Event Fully Booked · Waitlist Open
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </WebShell>
  );
}
