'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heading,
  Eyebrow,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  AscendLogoMark,
  ExportIcon,
  PlusIcon,
} from '@ascend/ui';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'payments' | 'members'>('overview');

  const payments = [
    { booking: 'ASC27-LAU-0613', attendee: 'CA Kavya Reddy', event: 'Launch Summit', status: 'Paid', amount: 1179 },
    { booking: 'ASC27-GST-0221', attendee: 'CA Ritu Sinha', event: 'GST Clinic', status: 'Pending', amount: 589 },
    { booking: 'ASC27-SPE-0118', attendee: 'Rahul Nair', event: 'Speed Networking', status: 'Paid', amount: 235 },
    { booking: 'ASC27-CFO-0087', attendee: 'CA Meera Iyer', event: 'Inside the CFO Office', status: 'Failed', amount: 943 },
    { booking: 'ASC27-TAX-0530', attendee: 'CA Vikram Rao', event: 'Budget 2027 Decoded', status: 'Refunded', amount: 471 },
  ];

  const events = [
    { title: 'ASCEND Launch Summit 2027', date: '01 Jan', fee: '₹1,499', taken: 612, seats: 800 },
    { title: 'AI for the Modern CA', date: '09 Jan', fee: 'Free', taken: 742, seats: 1000 },
    { title: 'GST Clinic: Notices & Appeals', date: '16 Jan', fee: '₹499', taken: 131, seats: 150 },
    { title: 'Young CA Speed Networking', date: '23 Jan', fee: '₹299', taken: 120, seats: 120 },
    { title: 'Budget 2027 Decoded', date: '03 Feb', fee: '₹399', taken: 530, seats: 2000 },
    { title: 'Inside the CFO Office', date: '06 Feb', fee: '₹799', taken: 88, seats: 200 },
  ];

  const members = [
    { name: 'CA Kavya Reddy', plan: 'Core', city: 'Hyderabad', joined: '03 Nov' },
    { name: 'CA Aman Joshi', plan: 'Core', city: 'Indore', joined: '04 Nov' },
    { name: 'Adv. Nikhil Sethi', plan: 'Associate', city: 'New Delhi', joined: '05 Nov' },
    { name: 'Rahul Nair', plan: 'Student', city: 'Bengaluru', joined: '06 Nov' },
  ];

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'ok';
      case 'Pending':
        return 'warn';
      case 'Failed':
        return 'bad';
      case 'Refunded':
      default:
        return 'mute';
    }
  };

  const weeklyBars = [180, 260, 310, 420, 388, 512];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-[var(--line)] bg-[rgba(6,10,31,0.8)] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A72FF] to-[#1F45D6] grid place-items-center text-white">
              <AscendLogoMark size={18} />
            </span>
            <div className="flex items-center gap-2">
              <b className="font-display font-semibold text-[15px] tracking-wider text-white">
                ASCEND
              </b>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--card)] text-[var(--muted)] border border-[var(--line)]">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[12px] text-[var(--muted)] hidden sm:inline">
              Super Admin · admin@ascend-ca.in
            </span>
            <button
              onClick={() => router.push('/login')}
              className="text-[13px] text-[var(--muted)] hover:text-white bg-transparent border-0 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-[1400px] mx-auto w-full px-6 py-10 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-8 md:gap-14 items-start">
          {/* Side Navigation */}
          <nav className="flex md:flex-col gap-1 border-b md:border-b-0 md:sticky md:top-24 border-[var(--line)] overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'events', label: 'Events' },
              { id: 'payments', label: 'Payments' },
              { id: 'members', label: 'Members' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`bg-transparent border-0 text-left py-2.5 px-3 md:px-0 text-[14.5px] cursor-pointer whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[var(--fg)] font-medium md:border-l-2 md:border-[var(--lime)] md:pl-3'
                      : 'text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => router.push('/theme')}
              className="bg-transparent border-0 text-left py-2.5 px-3 md:px-0 text-[14.5px] cursor-pointer whitespace-nowrap transition-colors text-[var(--accent)] hover:underline md:mt-4 md:border-t md:border-[var(--line)] md:pt-4"
            >
              🎨 Theme Studio ↗
            </button>
          </nav>

          {/* Tab Panes */}
          <div className="flex flex-col gap-10 min-w-0">
            {/* Header Title & Actions */}
            <div className="flex justify-between items-end gap-4 flex-wrap">
              <div>
                <Eyebrow>Admin</Eyebrow>
                <Heading level="h1" className="text-[34px] md:text-[40px] mt-2 capitalize">
                  {activeTab}
                </Heading>
              </div>
              <div className="flex gap-2.5">
                <Button variant="line" size="sm">
                  <ExportIcon size={16} /> Export
                </Button>
                <Button variant="dark" size="sm">
                  <PlusIcon size={16} /> Add event
                </Button>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* 4 KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--line)] rounded-[var(--r)] bg-[linear-gradient(180deg,rgba(219,231,240,0.05),rgba(219,231,240,0.015)),var(--card)] overflow-hidden">
                  <div className="p-6 border-r border-b lg:border-b-0 border-[var(--line)]">
                    <span className="text-[13px] text-[var(--muted)]">Registrations</span>
                    <b className="block font-display text-[32px] md:text-[38px] font-normal tracking-[-0.04em] mt-1.5 font-mono tabular-nums">
                      2,191
                    </b>
                    <em className="font-mono text-[12px] not-italic text-[var(--ok)]">+212 this week</em>
                  </div>
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-[var(--line)]">
                    <span className="text-[13px] text-[var(--muted)]">Pending payment</span>
                    <b className="block font-display text-[32px] md:text-[38px] font-normal tracking-[-0.04em] mt-1.5 font-mono tabular-nums">
                      198
                    </b>
                    <em className="font-mono text-[12px] not-italic text-[var(--warn)]">reminded</em>
                  </div>
                  <div className="p-6 border-r border-[var(--line)]">
                    <span className="text-[13px] text-[var(--muted)]">Seats left</span>
                    <b className="block font-display text-[32px] md:text-[38px] font-normal tracking-[-0.04em] mt-1.5 font-mono tabular-nums">
                      889
                    </b>
                    <em className="font-mono text-[12px] not-italic text-[var(--muted)]">6 events</em>
                  </div>
                  <div className="p-6">
                    <span className="text-[13px] text-[var(--muted)]">Revenue</span>
                    <b className="block font-display text-[32px] md:text-[38px] font-normal tracking-[-0.04em] mt-1.5 font-mono tabular-nums">
                      ₹16.4L
                    </b>
                    <em className="font-mono text-[12px] not-italic text-[var(--ok)]">before GST</em>
                  </div>
                </div>

                {/* Weekly Bars Chart */}
                <div className="p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--card)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-[12px] uppercase text-[var(--muted)]">
                      Registrations / week
                    </span>
                    <span className="font-mono text-[12px] uppercase text-[var(--muted)]">
                      6 weeks
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 h-36">
                    {weeklyBars.map((v, i) => (
                      <i
                        key={i}
                        className={`flex-1 rounded-[1px] transition-all duration-300 ${
                          i === weeklyBars.length - 1
                            ? 'bg-[repeating-linear-gradient(90deg,#6F95FF_0_2px,transparent_2px_4px)]'
                            : 'bg-[repeating-linear-gradient(90deg,rgba(219,231,240,0.16)_0_2px,transparent_2px_4px)]'
                        }`}
                        style={{ height: `${(v / 512) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent Payments Table */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[12px] uppercase text-[var(--muted)]">
                    Recent Bookings
                  </span>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead align="right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.booking}>
                          <TableCell className="font-mono text-[13px]">{p.booking}</TableCell>
                          <TableCell className="font-medium">{p.attendee}</TableCell>
                          <TableCell className="text-[var(--muted)]">{p.event}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(p.status) as any}>{p.status}</Badge>
                          </TableCell>
                          <TableCell align="right" className="font-mono">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead align="right">Seats</TableHead>
                    <TableHead align="right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell className="text-[var(--muted)]">{e.date}</TableCell>
                      <TableCell className="font-mono">{e.fee}</TableCell>
                      <TableCell align="right" className="font-mono">
                        {e.taken}/{e.seats}
                      </TableCell>
                      <TableCell align="right">
                        <Button variant="line" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.booking}>
                      <TableCell className="font-mono text-[13px]">{p.booking}</TableCell>
                      <TableCell className="font-medium">{p.attendee}</TableCell>
                      <TableCell className="text-[var(--muted)]">{p.event}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status) as any}>{p.status}</Badge>
                      </TableCell>
                      <TableCell align="right" className="font-mono">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="font-mono">{m.plan}</TableCell>
                      <TableCell className="text-[var(--muted)]">{m.city}</TableCell>
                      <TableCell className="text-[var(--muted)]">{m.joined}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
