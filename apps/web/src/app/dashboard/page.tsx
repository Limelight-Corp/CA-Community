'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import {
  Heading,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  useToast,
} from '@ascend/ui';

export default function MemberDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'events' | 'receipts' | 'profile'>('events');

  const [profileData, setProfileData] = useState({
    name: 'CA Kavya Reddy',
    email: 'kavya.reddy@example.com',
    city: 'Hyderabad',
    firm: 'Reddy & Rao Associates',
  });

  const memberEvents = [
    {
      id: 'launch',
      title: 'ASCEND Launch Summit 2027',
      date: '01 Jan',
      bookingCode: 'ASC27-LAU-0613',
      status: 'Confirmed',
    },
    {
      id: 'ai-ca',
      title: 'AI for the Modern CA',
      date: '09 Jan',
      bookingCode: 'ASC27-AIC-0654',
      status: 'Confirmed',
    },
    {
      id: 'gst',
      title: 'GST Clinic: Notices & Appeals',
      date: '16 Jan',
      bookingCode: 'ASC27-GST-0695',
      status: 'Confirmed',
    },
  ];

  const receipts = [
    { id: 'RCPT-0041', item: 'Core membership 2027', amount: 1180 },
    { id: 'RCPT-0388', item: 'Launch Summit 2027', amount: 1179 },
    { id: 'RCPT-0102', item: 'GST Clinic', amount: 353 },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Profile saved successfully.');
  };

  return (
    <WebShell>
      <section className="max-w-[1200px] mx-auto px-5 md:px-8 py-14 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-8 md:gap-16 items-start">
          {/* Side Navigation */}
          <nav className="flex md:flex-col gap-1 border-b md:border-b-0 md:sticky md:top-24 border-[var(--line)] overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'events', label: 'My events' },
              { id: 'receipts', label: 'Receipts' },
              { id: 'profile', label: 'Profile' },
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
          </nav>

          {/* Tab Content */}
          <div className="flex flex-col gap-12 min-w-0">
            {/* Header User Profile Banner */}
            <div className="flex items-center gap-5 flex-wrap">
              <span className="w-18 h-18 rounded-full bg-[var(--lime)] text-white text-[22px] font-semibold grid place-items-center shadow-lg">
                KR
              </span>
              <div>
                <Heading level="h1" className="text-[clamp(30px,3.6cqi,44px)]">
                  Hello, Kavya
                </Heading>
                <p className="text-[14px] text-[var(--muted)] mt-1">
                  Core member · Founding member · Valid till Dec 2027
                </p>
              </div>
            </div>

            {/* My Events Tab */}
            {activeTab === 'events' && (
              <div className="flex flex-col gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberEvents.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium text-[var(--fg)]">
                          {ev.title}
                        </TableCell>
                        <TableCell className="text-[var(--muted)]">{ev.date}</TableCell>
                        <TableCell className="font-mono text-[13px] text-[var(--muted)]">
                          {ev.bookingCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="ok">Confirmed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Receipts Tab */}
            {activeTab === 'receipts' && (
              <div className="flex flex-col gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead align="right">Amount</TableHead>
                      <TableHead align="right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((rcpt) => (
                      <TableRow key={rcpt.id}>
                        <TableCell className="font-mono text-[13px] text-[var(--muted)]">
                          {rcpt.id}
                        </TableCell>
                        <TableCell>{rcpt.item}</TableCell>
                        <TableCell align="right" className="font-mono">
                          ₹{rcpt.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="line"
                            size="sm"
                            onClick={() => toast(`Downloading ${rcpt.id} PDF...`)}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                  <Input
                    label="Email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                  <Input
                    label="City"
                    value={profileData.city}
                    onChange={(e) =>
                      setProfileData({ ...profileData, city: e.target.value })
                    }
                  />
                  <Input
                    label="Firm"
                    value={profileData.firm}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firm: e.target.value })
                    }
                  />
                </div>
                <Button variant="dark" type="submit" className="self-start">
                  Save profile
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </WebShell>
  );
}
