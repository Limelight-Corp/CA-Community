'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { WebShell } from '../../components/WebShell';
import {
  PROTOTYPE_EVENTS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_WINGS,
  PROTOTYPE_RESOURCES,
} from '@ascend/shared';

const NEWS_ITEMS = [
  { title: 'Founding member registrations open', date: '03 Nov 2026', desc: 'The first 500 members get founding status and a reserved Launch Summit seat.' },
  { title: 'Ten wings and their conveners announced', date: '28 Oct 2026', desc: 'Each wing will run a monthly format and one annual summit.' },
  { title: 'City Leads confirmed for four cities', date: '20 Oct 2026', desc: 'Delhi, Mumbai, Bengaluru and Pune go first.' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || 'tax';
  const [query, setQuery] = useState(initialQuery);

  const quickChips = ['tax', 'AI', 'CFO', 'Mumbai'];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{
      kind: string;
      title: string;
      subtitle: string;
      url: string;
    }> = [];

    // Events
    PROTOTYPE_EVENTS.forEach((e) => {
      if ((e.title + ' ' + e.city + ' ' + e.category + ' ' + e.description).toLowerCase().includes(q)) {
        items.push({
          kind: 'Event',
          title: e.title,
          subtitle: `${e.date} · ${e.city}`,
          url: `/events/${e.slug}`,
        });
      }
    });

    // Speakers
    Object.values(PROTOTYPE_SPEAKERS).forEach((s) => {
      if ((s.name + ' ' + s.title + ' ' + s.bio + ' ' + s.expertise.join(' ')).toLowerCase().includes(q)) {
        items.push({
          kind: 'Speaker',
          title: s.name,
          subtitle: s.title,
          url: `/speakers/${s.slug}`,
        });
      }
    });

    // Resources
    PROTOTYPE_RESOURCES.forEach((r) => {
      if ((r.title + ' ' + r.category + ' ' + r.format).toLowerCase().includes(q)) {
        items.push({
          kind: 'Resource',
          title: r.title,
          subtitle: `${r.category} · ${r.format}`,
          url: '/resources',
        });
      }
    });

    // News
    NEWS_ITEMS.forEach((n) => {
      if ((n.title + ' ' + n.desc).toLowerCase().includes(q)) {
        items.push({
          kind: 'News',
          title: n.title,
          subtitle: n.date,
          url: '/news',
        });
      }
    });

    // Wings
    PROTOTYPE_WINGS.forEach((w) => {
      if ((w.name + ' ' + w.tags + ' ' + w.activities.join(' ')).toLowerCase().includes(q)) {
        items.push({
          kind: 'Wing',
          title: w.name,
          subtitle: w.tags,
          url: '/wings',
        });
      }
    });

    return items;
  }, [query]);

  return (
    <>
      {/* Header with Underline Search - Prototype Exact V.search */}
      <section className="ph" style={{ border: 0 }}>
        <div className="wrap">
          <span className="eyebrow">Search</span>
          <div className="search" style={{ marginTop: '24px' }}>
            <svg
              className="ico"
              viewBox="0 0 24 24"
              style={{
                width: '22px',
                height: '22px',
                left: 0,
                position: 'absolute',
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
              id="sq"
              className="inp search-underline"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Events, speakers, news"
              aria-label="Search"
              autoFocus
            />
          </div>
          <div className="chips" style={{ marginTop: '20px' }}>
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`chip ${query.toLowerCase() === chip.toLowerCase() ? 'active' : ''}`}
                aria-pressed={query.toLowerCase() === chip.toLowerCase()}
                onClick={() => setQuery(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="wrap">
        <p className="eyebrow" style={{ marginBottom: '8px' }}>
          {results.length} result{results.length === 1 ? '' : 's'}
        </p>

        {results.length > 0 ? (
          <div>
            {results.map((r, i) => (
              <Link
                key={i}
                href={r.url}
                className="lrow srow"
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <span className="eyebrow">{r.kind}</span>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: 500, letterSpacing: '-0.015em' }}>
                    {r.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                    {r.subtitle}
                  </p>
                </div>
                <span className="arrow" aria-hidden="true">
                  <svg className="ico" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            Try another word, like &ldquo;audit&rdquo; or &ldquo;Pune&rdquo;.
          </div>
        )}
      </section>

      <div style={{ height: 'var(--sec)' }} />
    </>
  );
}

export default function SearchPage() {
  return (
    <WebShell>
      <Suspense fallback={<div className="wrap sec"><p className="muted">Loading search...</p></div>}>
        <SearchContent />
      </Suspense>
    </WebShell>
  );
}
