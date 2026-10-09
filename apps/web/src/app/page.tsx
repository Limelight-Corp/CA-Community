'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell } from '../components/WebShell';
import {
  Heading,
  Eyebrow,
  Button,
  SegmentedControl,
  GrowthChart,
  CalendarPreview,
  EventCard,
  WingRow,
  ChartRange,
  CalendarRange,
  ArrowIcon,
  GridIcon,
  CalendarIcon,
  HomeIcon,
  UserIcon,
} from '@ascend/ui';
import {
  PROTOTYPE_WINGS,
  PROTOTYPE_SPEAKERS,
} from '@ascend/shared';
import { useCommunityData } from '../lib/useCommunityData';

export default function HomePage() {
  const router = useRouter();
  const [chartRange, setChartRange] = useState<ChartRange>('all');
  const [calRange, setCalRange] = useState<CalendarRange>('yr');
  const [openWing, setOpenWing] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#wings') {
      const el = document.getElementById('wings');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  const { data } = useCommunityData(true);
  const liveEvents = (data.events || []).filter((e) => e.isPublished !== false);
  const liveWings = (data.wings || []).filter((w) => w.isPublished !== false);
  const liveSpeakers = data.speakers || [];

  const launchDate = new Date('2027-01-01T00:00:00');
  const daysToLaunch = Math.max(
    0,
    Math.ceil((launchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const upcomingEvents = liveEvents.slice(0, 3).map((e) => {
    const wing = liveWings.find((w) => w.number === e.wingNumber) || PROTOTYPE_WINGS[0];
    const speakers = e.speakerSlugs.map((slug) => {
      const spk = liveSpeakers.find((s) => s.slug === slug);
      return {
        name: spk?.name || PROTOTYPE_SPEAKERS[slug]?.name || slug,
      };
    });
    return {
      id: e.slug || e.id,
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
      speakers,
    };
  });

  return (
    <WebShell>
      {/* Hero Section */}
      <section className="pt-14 md:pt-24 pb-0 bg-[radial-gradient(55%_45%_at_88%_0%,rgb(var(--cobalt-rgb)/0.55)_0%,rgb(var(--cobalt-rgb)/0)_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Pan-India CA community · Est. 2027
            </span>
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--fg)]">
              <span className="tabular-nums font-semibold">{daysToLaunch}</span> days to launch
            </span>
          </div>

          <Heading
            level="h1"
            className="text-[clamp(46px,6.6cqi,88px)] font-medium tracking-[-0.045em] leading-[1.02] max-w-[13ch] mt-7"
          >
            Where young CAs{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-mist to-white">
              rise together.
            </em>
          </Heading>

          <div className="flex justify-between items-end gap-8 flex-wrap mt-10">
            <p className="max-w-[46ch] text-[var(--muted)] text-[18px] leading-[1.6]">
              Events, ten professional wings and a network that grows with your career.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <Button variant="dark" onClick={() => router.push('/membership')}>
                Join the community
              </Button>
              <Button variant="line" onClick={() => router.push('/events')}>
                Explore events
              </Button>
            </div>
          </div>

          {/* Road-to-launch Chart Card */}
          <div className="mt-14 md:mt-22 border-t border-[var(--line)] pt-8">
            <div className="flex justify-between items-start gap-5 flex-wrap mb-6">
              <div className="flex items-baseline gap-3.5 flex-wrap">
                <span className="font-display text-[64px] md:text-[116px] font-light tracking-[-0.05em] leading-[0.9]">
                  500<span className="text-[var(--faint)]">+</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--lime)] text-white font-mono text-[11.5px] py-1 px-2 rounded align-top self-start mt-2.5">
                  ▲ Target
                </span>
                <span className="text-[18px] md:text-[24px] text-[var(--muted)]">
                  members by launch
                </span>
              </div>

              <SegmentedControl
                options={[
                  { id: 'oct', label: 'Oct' },
                  { id: 'nov', label: 'Nov' },
                  { id: 'dec', label: 'Dec' },
                  { id: 'all', label: 'Full plan' },
                ]}
                value={chartRange}
                onChange={setChartRange}
              />
            </div>

            <GrowthChart range={chartRange} />

            <div className="flex gap-5 flex-wrap text-[13px] text-[var(--muted)] mt-3.5">
              <span className="flex items-center gap-2">
                <i className="w-2.5 h-2.5 rounded-[2px] bg-brand-300" />
                Registered members
              </span>
              <span className="flex items-center gap-2">
                <i className="w-2.5 h-[2px] bg-mist" />
                Founding committee
              </span>
              <span className="flex items-center gap-2">
                <i className="w-2.5 h-2.5 rounded-[2px] bg-[rgb(var(--mist-rgb)/0.25)]" />
                Daily sign-ups
              </span>
            </div>
          </div>

          {/* Tri-Panel Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_0.9fr] gap-3 mt-14 md:mt-20">
            {/* 1. 2027 Calendar */}
            <div className="p-7 md:p-8 rounded-[24px] border border-[var(--line)] flex flex-col justify-between gap-6 bg-[radial-gradient(90%_80%_at_0%_0%,rgb(var(--lime-rgb)/0.55),transparent_60%),linear-gradient(180deg,var(--brand-900),var(--brand-950))]">
              <div className="flex justify-between items-center gap-3">
                <h3 className="font-display text-[19px] font-medium tracking-tight text-white">
                  2027 Calendar
                </h3>
                <SegmentedControl
                  options={[
                    { id: 'q1', label: 'Q1' },
                    { id: 'h1', label: 'H1' },
                    { id: 'yr', label: 'Year' },
                  ]}
                  value={calRange}
                  onChange={setCalRange}
                  size="sm"
                />
              </div>

              <CalendarPreview range={calRange} />

              <div className="flex gap-4 flex-wrap text-[12.5px] text-fg-subtle mt-auto">
                <span className="flex items-center gap-2">
                  <i className="w-2 h-2 rounded-[2px] bg-brand-200" />
                  Learning
                </span>
                <span className="flex items-center gap-2">
                  <i className="w-2 h-2 rounded-[2px] bg-white" />
                  Summits
                </span>
                <span className="flex items-center gap-2">
                  <i className="w-2 h-2 rounded-[2px] bg-brand-500" />
                  Networking
                </span>
              </div>
            </div>

            {/* 2. Membership */}
            <div className="p-7 md:p-8 rounded-[24px] border border-[var(--line)] flex flex-col justify-between gap-6 bg-[linear-gradient(180deg,var(--surface-hi),var(--surface-lo))]">
              <div className="flex justify-between items-center gap-3">
                <h3 className="font-display text-[19px] font-medium tracking-tight text-[var(--fg)]">
                  Membership
                </h3>
                <button
                  onClick={() => router.push('/membership')}
                  className="bg-transparent border-0 p-0 text-[var(--muted)] hover:text-white font-medium text-[13px] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Compare <ArrowIcon size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 flex-1 items-end mt-4">
                {[
                  { name: 'Core', who: 'CA professionals', price: '1,000', height: 100, grad: 'from-brand-300 via-brand-500 to-brand-700' },
                  { name: 'Associate', who: 'Allied professionals', price: '1,000', height: 78, grad: 'from-chart-2a via-chart-2b to-brand-900' },
                  { name: 'Student', who: 'CA students', price: '499', height: 52, grad: 'from-chart-3a via-chart-3b to-chart-3c' },
                ].map((plan, i) => (
                  <div key={i} className="flex flex-col gap-2 justify-end min-w-0">
                    <span className="font-display text-[18px] md:text-[21px] font-medium text-white tracking-tight">
                      <small className="text-[0.7em] text-[var(--muted)]">₹</small>
                      {plan.price}
                      <em className="font-mono text-[11px] not-italic text-[var(--muted)] ml-0.5">/yr</em>
                    </span>
                    <div
                      className={`rounded-[12px] bg-gradient-to-b ${plan.grad} shadow-md`}
                      style={{ height: `${plan.height * 1.3}px` }}
                    />
                    <b className="text-[14px] font-semibold text-white mt-1">{plan.name}</b>
                    <span className="text-[12px] text-[var(--muted)] leading-tight">{plan.who}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. At a glance */}
            <div className="p-7 md:p-8 rounded-[24px] border border-[var(--line)] flex flex-col justify-between gap-6 bg-[linear-gradient(180deg,var(--surface-hi),var(--surface-lo))]">
              <h3 className="font-display text-[19px] font-medium tracking-tight text-[var(--fg)]">
                At a glance
              </h3>

              <div className="flex flex-col gap-1 my-2">
                {[
                  { icon: GridIcon, label: 'Professional wings', val: '10' },
                  { icon: CalendarIcon, label: 'Launch', val: '1 Jan 2027' },
                  { icon: HomeIcon, label: 'Network', val: 'Pan-India' },
                  { icon: UserIcon, label: 'Founding target', val: '500+' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-2.5 border-b border-[rgb(var(--mist-rgb)/0.07)] last:border-0"
                    >
                      <i className="w-9 h-9 rounded-[11px] grid place-items-center bg-[rgb(var(--lime-rgb)/0.14)] border border-[rgb(var(--brand-300-rgb)/0.25)] text-brand-200">
                        <Icon size={16} />
                      </i>
                      <span className="text-[13.5px] text-[var(--muted)]">{item.label}</span>
                      <b className="font-display text-[17px] font-medium tracking-tight text-[var(--fg)]">
                        {item.val}
                      </b>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="line"
                size="sm"
                onClick={() => router.push('/wings')}
                className="self-start mt-auto"
              >
                Explore the 10 wings <ArrowIcon size={15} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="flex justify-between items-end gap-6 flex-wrap mb-14">
          <div>
            <Eyebrow pill>Upcoming</Eyebrow>
            <Heading level="h2" className="mt-5 max-w-[18ch]">
              Events worth showing up for.
            </Heading>
          </div>
          <button
            onClick={() => router.push('/events')}
            className="border-0 border-b border-current pb-0.5 text-[14.5px] font-medium inline-flex items-center gap-2 cursor-pointer bg-transparent text-[var(--fg)] hover:text-white"
          >
            All events <ArrowIcon size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {upcomingEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onSelect={() => router.push(`/events/${e.slug}`)}
              onRegister={() => router.push(`/events/${e.slug}/register`)}
            />
          ))}
        </div>
      </section>

      {/* 10 Wings Preview Section */}
      <section id="wings" className="pb-24 max-w-[1200px] mx-auto px-5 md:px-8 scroll-mt-24">
        <div className="flex justify-between items-end gap-6 flex-wrap mb-14">
          <div>
            <Eyebrow pill>10 wings</Eyebrow>
            <Heading level="h2" className="mt-5 max-w-[18ch]">
              Find your people by{' '}
              <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
                what you practise.
              </em>
            </Heading>
          </div>
          <button
            onClick={() => router.push('/wings')}
            className="border-0 border-b border-current pb-0.5 text-[14.5px] font-medium inline-flex items-center gap-2 cursor-pointer bg-transparent text-[var(--fg)] hover:text-white transition-colors"
          >
            Explore wings <ArrowIcon size={16} />
          </button>
        </div>

        <div className="border-t border-[var(--line)]">
          {liveWings.slice(0, 5).map((w) => (
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

      {/* CTA Section */}
      <section className="pb-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="rounded-[var(--r)] p-10 md:p-18 bg-[radial-gradient(90%_140%_at_100%_0%,#4A72FF_0%,#0F38C0_40%,#0C1A58_100%)] text-white border border-[rgb(var(--sky-rgb)/0.25)] shadow-[0_40px_80px_-40px_rgb(var(--lime-rgb)/0.7)] flex justify-between items-end gap-8 flex-wrap">
          <Heading level="h2" className="text-white max-w-[16ch]">
            Your next step in the profession.
          </Heading>
          <Button
            variant="dark"
            onClick={() => router.push('/membership')}
            className="bg-white text-brand-900 shadow-none hover:brightness-105"
          >
            Become a member
          </Button>
        </div>
      </section>
    </WebShell>
  );
}
