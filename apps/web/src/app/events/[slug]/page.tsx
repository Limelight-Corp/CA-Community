'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WebShell } from '../../../components/WebShell';
import {
  Heading,
  Eyebrow,
  Badge,
  Button,
  BackIcon,
  getInitials,
} from '@ascend/ui';
import {
  PROTOTYPE_EVENTS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_WINGS,
} from '@ascend/shared';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const event = PROTOTYPE_EVENTS.find((e) => e.slug === slug) || PROTOTYPE_EVENTS[0]!;
  const wing = PROTOTYPE_WINGS.find((w) => w.number === event.wingNumber);
  const speakers = event.speakerSlugs.map((sSlug) => PROTOTYPE_SPEAKERS[sSlug]).filter(Boolean);

  const seatsRemaining = Math.max(0, event.seatsTotal - event.seatsTaken);
  const isSoldOut = seatsRemaining === 0;

  const sampleAgenda = [
    { time: '10:00 AM', title: 'Registration & Welcome Networking Coffee' },
    { time: '10:30 AM', title: 'Keynote & Executive Council Presentation' },
    { time: '11:45 AM', title: 'Technical Deep-dive & Case Law Working Session' },
    { time: '01:15 PM', title: 'Networking Lunch' },
    { time: '02:15 PM', title: 'Open Clinic & Interactive Member Q&A' },
    { time: '03:45 PM', title: 'Closing Remarks & CPE Certification Desk' },
  ];

  return (
    <WebShell>
      {/* Event Header Banner */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <button
            onClick={() => router.push('/events')}
            className="inline-flex items-center gap-2 text-[13px] font-mono text-[var(--muted)] hover:text-[var(--fg)] mb-8 transition-colors"
          >
            <BackIcon size={14} />
            <span>Back to All Events</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {wing && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-full)] text-[12px] font-medium border border-[var(--line)]"
                style={{ backgroundColor: `${wing.color}22`, color: wing.color }}
              >
                Wing {wing.number}: {wing.name}
              </span>
            )}
            <Badge variant={event.mode === 'Online' ? 'blue' : 'green'}>{event.mode}</Badge>
            <Badge variant="neutral">{event.category}</Badge>
          </div>

          <Heading level="h1" className="text-[clamp(36px,5cqi,64px)] max-w-[20ch] leading-[1.15]">
            {event.title}
          </Heading>

          <p className="text-[18px] text-[var(--muted)] font-light mt-6 max-w-[54ch] leading-relaxed">
            {event.description}
          </p>
        </div>
      </section>

      {/* Main Content Layout with Sticky Sidebar */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Details */}
          <div className="lg:col-span-8 flex flex-col gap-14">
            {/* Featured Speakers */}
            {speakers.length > 0 && (
              <div>
                <Eyebrow pill>Faculty & Speakers</Eyebrow>
                <Heading level="h2" className="text-[26px] mt-3 mb-8">
                  Featured Session Leads
                </Heading>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {speakers.map((sp) => (
                    <Link
                      key={sp!.slug}
                      href={`/speakers/${sp!.slug}`}
                      className="group p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-elevated)] transition-all flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-[linear-gradient(135deg,#0C1A58,#173196)] border border-[var(--line)] flex-shrink-0 grid place-items-center text-[18px] font-medium text-white shadow-sm">
                        {getInitials(sp!.name)}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-display text-[17px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
                          {sp!.name}
                        </h3>
                        <p className="text-[13px] text-[var(--muted)] line-clamp-1 mb-2">
                          {sp!.title}
                        </p>
                        <span className="text-[12px] font-mono text-[var(--accent)]">
                          View profile ↗
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda Timeline */}
            <div>
              <Eyebrow pill>Structure</Eyebrow>
              <Heading level="h2" className="text-[26px] mt-3 mb-8">
                Session Agenda
              </Heading>

              <div className="border-t border-[var(--line)]">
                {sampleAgenda.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] py-5 border-b border-[var(--line)] items-baseline gap-4"
                  >
                    <span className="font-mono text-[13px] text-[var(--accent)]">
                      {item.time}
                    </span>
                    <span className="text-[15.5px] font-medium text-[var(--fg)]">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Guidelines */}
            <div className="p-8 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)]">
              <h3 className="font-display text-[18px] font-medium text-[var(--fg)] mb-3">
                Attendance & Venue Guidelines
              </h3>
              <ul className="flex flex-col gap-2.5 text-[14px] text-[var(--muted)] leading-relaxed list-disc list-inside">
                <li>Digital ticket with QR code must be presented at the check-in reception.</li>
                <li>Members claiming discounted registration must have active membership verified.</li>
                <li>Statutory GST Tax Invoice under SAC 998399 is issued immediately to your dashboard.</li>
                <li>CPE credit hours confirmation letter will be emailed to verified attendees within 48 hours.</li>
              </ul>
            </div>
          </div>

          {/* Sticky Quick Facts Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-[var(--r)] border border-[var(--line-strong)] bg-[var(--surface)] p-7 shadow-2xl flex flex-col gap-6">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Pricing & Pass
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[32px] font-medium text-[var(--fg)]">
                    {event.fee === 0 ? 'Free' : `₹${event.fee.toLocaleString('en-IN')}`}
                  </span>
                  {event.memberFee !== event.fee && (
                    <span className="font-mono text-[13px] text-[var(--accent)]">
                      ₹{event.memberFee.toLocaleString('en-IN')} for Members
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 py-4 border-y border-[var(--line)] text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Date</span>
                  <span className="font-mono text-[var(--fg)]">{event.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Time</span>
                  <span className="font-mono text-[var(--fg)]">{event.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Venue</span>
                  <span className="font-medium text-[var(--fg)] text-right max-w-[18ch] truncate">
                    {event.venue}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Location</span>
                  <span className="font-mono text-[var(--fg)]">{event.city}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Available Seats</span>
                  <span className={`font-mono font-medium ${isSoldOut ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                    {isSoldOut ? 'Sold Out' : `${seatsRemaining} seats left`}
                  </span>
                </div>
              </div>

              {isSoldOut ? (
                <Button variant="secondary" size="lg" disabled className="w-full">
                  Waitlist Only
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/events/${event.slug}/register`)}
                >
                  Register Now →
                </Button>
              )}

              <p className="text-[12px] text-center text-[var(--faint)]">
                Instant confirmation · Razorpay SSL Secured
              </p>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
