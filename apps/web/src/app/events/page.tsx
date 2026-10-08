'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WebShell } from '../../components/WebShell';
import { PROTOTYPE_EVENTS, PROTOTYPE_WINGS, PROTOTYPE_SPEAKERS } from '@ascend/shared';

export default function EventsPage() {
  const [formatFilter, setFormatFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Career'];

  const filteredEvents = PROTOTYPE_EVENTS.filter((e) => {
    const wing = PROTOTYPE_WINGS.find((w) => w.number === e.wingNumber);
    const wingName = wing ? wing.name : '';
    const matchesSearch =
      !searchQuery ||
      (e.title + ' ' + e.city + ' ' + wingName).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesFormat = !formatFilter || e.mode === formatFilter;

    return matchesSearch && matchesCat && matchesFormat;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setFormatFilter('');
  };

  return (
    <WebShell>
      {/* Page Header (Prototype Exact ph) */}
      <section className="ph">
        <div className="wrap ph-row">
          <div>
            <span className="eyebrow">Events</span>
            <h1>
              Learn something. <em className="s">Meet someone.</em>
            </h1>
            <p>Register in under two minutes. Pay by UPI, card or net banking.</p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar (Prototype Exact .filters) */}
      <section className="wrap">
        <div className="filters">
          <div className="search">
            <svg
              className="ico"
              viewBox="0 0 24 24"
              style={{
                width: 18,
                height: 18,
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" strokeWidth="1.6" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              id="fq"
              className="inp"
              placeholder="Search events or cities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search events"
            />
          </div>

          <select
            id="fmode"
            className="inp"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            aria-label="Format"
          >
            <option value="">Online &amp; offline</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <div className="chips">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${categoryFilter === c ? 'active' : ''}`}
                aria-pressed={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid g3">
            {filteredEvents.map((e) => {
              const wing = PROTOTYPE_WINGS.find((w) => w.number === e.wingNumber) || PROTOTYPE_WINGS[0]!;
              const leftSeats = Math.max(0, e.seatsTotal - e.seatsTaken);
              const isSoldOut = leftSeats <= 0;
              const isFillingFast = !isSoldOut && leftSeats / e.seatsTotal < 0.15;
              const statusText = isSoldOut ? 'Sold out' : isFillingFast ? 'Filling fast' : 'Open';
              const dotColor = isSoldOut ? '#FF9AA3' : isFillingFast ? '#FFD27A' : '#86EBB0';
              const fillPercent = Math.min(100, (e.seatsTaken / e.seatsTotal) * 100);

              const dateParts = e.date.split(' ');
              const day = dateParts[0] || '01';
              const month = dateParts[1] || 'Jan';
              const year = dateParts[2] || '2027';

              const firstSpeakerSlug = e.speakerSlugs[0];
              const firstSpeaker = firstSpeakerSlug ? PROTOTYPE_SPEAKERS[firstSpeakerSlug] : undefined;

              return (
                <Link
                  key={e.slug}
                  href={`/events/${e.slug}`}
                  className="ev"
                  style={{ '--wc': wing.color } as React.CSSProperties}
                  aria-label={e.title}
                >
                  <div className="ev-tile">
                    <div className="ev-row">
                      <span className="glass">{e.mode === 'Online' ? 'Online' : e.city}</span>
                      <span className="glass" style={{ '--dot': dotColor } as React.CSSProperties}>
                        <i />
                        {statusText}
                      </span>
                    </div>
                    <div className="ev-date">
                      <b>{day}</b>
                      <span>
                        {month} {year}
                        <br />
                        {e.time}
                      </span>
                    </div>
                  </div>

                  <div className="ev-body">
                    <span className="ev-kicker">
                      <i />
                      {e.category} · {wing.name}
                    </span>
                    <h3>{e.title}</h3>
                    <div className="ev-meta">
                      <span>
                        <svg className="ico" viewBox="0 0 24 24">
                          {e.mode === 'Online' ? (
                            <rect x="3" y="4.5" width="18" height="16" rx="3" />
                          ) : (
                            <path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5" />
                          )}
                        </svg>
                        {e.venue}
                      </span>
                      {firstSpeaker && (
                        <span>
                          <svg className="ico" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                          </svg>
                          {firstSpeaker.name}
                          {e.speakerSlugs.length > 1 && ` +${e.speakerSlugs.length - 1}`}
                        </span>
                      )}
                    </div>

                    <div className="ev-cap">
                      <div className={`bar ${isSoldOut ? 'full' : ''}`}>
                        <i style={{ width: `${fillPercent}%` }} />
                      </div>
                      <div>
                        <span>{Math.min(e.seatsTaken, e.seatsTotal)} registered</span>
                        <span>{isSoldOut ? 'Waitlist open' : `${leftSeats} left`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ev-foot">
                    <div className="fee">
                      {e.fee === 0 ? 'Free' : `₹${e.fee.toLocaleString('en-IN')}`}
                      <small>
                        {e.fee && e.memberFee < e.fee
                          ? `Members ₹${e.memberFee.toLocaleString('en-IN')}`
                          : e.fee
                          ? 'Incl. certificate'
                          : 'For all members'}
                      </small>
                    </div>
                    <button className="arrow" aria-label={`Register for ${e.title}`} type="button">
                      <svg className="ico" viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            No events match.{' '}
            <button className="link" onClick={clearFilters} type="button">
              Clear filters
            </button>
          </div>
        )}
      </section>

      <div style={{ height: 'var(--sec)' }} />
    </WebShell>
  );
}
