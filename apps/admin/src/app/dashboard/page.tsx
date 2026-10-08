'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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

  const pillClass = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'p-ok';
      case 'Pending':
        return 'p-warn';
      case 'Failed':
        return 'p-bad';
      case 'Refunded':
      default:
        return 'p-mute';
    }
  };

  const weeklyBars = [180, 260, 310, 420, 388, 512];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      {/* Admin Header */}
      <header className="hdr">
        <div className="wrap">
          <div className="logo">
            <span className="logo-mark">
              <AscendLogoMark size={18} />
            </span>
            <b>ASCEND</b>
            <span className="pill p-mute" style={{ marginLeft: 8, fontSize: 10 }}>
              Admin Console
            </span>
          </div>

          <div className="hdr-r">
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
              Super Admin · admin@ascend-ca.in
            </span>
            <button
              onClick={() => router.push('/theme')}
              className="btn btn-line btn-sm"
              style={{ fontSize: 13 }}
            >
              Theme Studio
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 13 }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Section - Exact Prototype V.admin Structure */}
      <section className="wrap dash">
        {/* Side Navigation */}
        <nav className="snav">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Events' },
            { id: 'payments', label: 'Payments' },
            { id: 'members', label: 'Members' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-current={activeTab === tab.id ? 'true' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Pane */}
        <div style={{ display: 'grid', gap: '48px', minWidth: 0 }}>
          {/* Header Title & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span className="eyebrow">Admin</span>
              <h1 style={{ fontSize: 'clamp(30px, 3.6cqi, 44px)', fontWeight: 500, letterSpacing: '-0.04em', marginTop: '10px', textTransform: 'capitalize' }}>
                {activeTab}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-line btn-sm" onClick={() => alert('Exporting CSV...')}>
                <ExportIcon size={15} /> Export
              </button>
              <button className="btn btn-dark btn-sm" onClick={() => alert('Add event modal opens')}>
                <PlusIcon size={15} /> Add event
              </button>
            </div>
          </div>

          {/* Overview Tab: KPIs + Weekly Bars + Payments Table */}
          {activeTab === 'overview' && (
            <>
              <div className="kpis">
                <div>
                  <span>Registrations</span>
                  <b>2,191</b>
                  <em>+212 this week</em>
                </div>
                <div>
                  <span>Pending payment</span>
                  <b>198</b>
                  <em style={{ color: 'var(--warn)' }}>reminded</em>
                </div>
                <div>
                  <span>Seats left</span>
                  <b>889</b>
                  <em style={{ color: 'var(--muted)' }}>6 events</em>
                </div>
                <div>
                  <span>Revenue</span>
                  <b>₹16.4L</b>
                  <em>before GST</em>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span className="eyebrow">Registrations / week</span>
                  <span className="eyebrow">6 weeks</span>
                </div>
                <div className="bars">
                  {weeklyBars.map((v, i) => (
                    <i key={i} style={{ height: `${(v / 512) * 100}%` }} />
                  ))}
                </div>
              </div>

              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Attendee</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th className="r">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.booking}>
                        <td className="mono">{p.booking}</td>
                        <td style={{ fontWeight: 500 }}>{p.attendee}</td>
                        <td style={{ color: 'var(--muted)' }}>{p.event}</td>
                        <td>
                          <span className={`pill ${pillClass(p.status)}`}>{p.status}</span>
                        </td>
                        <td className="r mono">₹{p.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Fee</th>
                    <th className="r">Seats</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{e.title}</td>
                      <td style={{ color: 'var(--muted)' }}>{e.date}</td>
                      <td className="mono">{e.fee}</td>
                      <td className="r mono">{e.taken}/{e.seats}</td>
                      <td className="r">
                        <button className="btn btn-line btn-sm" onClick={() => alert(`Edit event: ${e.title}`)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Attendee</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.booking}>
                      <td className="mono">{p.booking}</td>
                      <td style={{ fontWeight: 500 }}>{p.attendee}</td>
                      <td style={{ color: 'var(--muted)' }}>{p.event}</td>
                      <td>
                        <span className={`pill ${pillClass(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="r mono">₹{p.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>City</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td className="mono">{m.plan}</td>
                      <td style={{ color: 'var(--muted)' }}>{m.city}</td>
                      <td style={{ color: 'var(--muted)' }}>{m.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
