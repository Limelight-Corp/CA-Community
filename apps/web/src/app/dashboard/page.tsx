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
  Modal,
  useToast,
} from '@ascend/ui';

interface MemberEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  bookingCode: string;
  status: string;
}

interface MemberReceipt {
  id: string;
  invoiceNo: string;
  item: string;
  sacCode: string;
  taxable: number;
  cgst: number;
  sgst: number;
  amount: number;
  date: string;
}

export default function MemberDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'events' | 'receipts' | 'profile' | 'wings'>('events');
  const [selectedPass, setSelectedPass] = useState<MemberEvent | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<MemberReceipt | null>(null);

  const [profileData, setProfileData] = useState({
    name: 'CA Kavya Reddy',
    email: 'kavya.reddy@example.com',
    mno: '084291',
    city: 'Hyderabad',
    firm: 'Reddy & Rao Associates',
    bio: 'Partner specializing in corporate tax structuring and cross-border transfer pricing.',
    linkedin: 'https://linkedin.com/in/kavyareddy-ca',
  });

  const memberEvents: MemberEvent[] = [
    {
      id: 'launch',
      title: 'ASCEND Launch Summit 2027',
      date: '01 Jan 2027',
      venue: 'Bharat Mandapam, New Delhi',
      bookingCode: 'ASC27-LAU-0613',
      status: 'Confirmed',
    },
    {
      id: 'ai-ca',
      title: 'AI for the Modern CA',
      date: '09 Jan 2027',
      venue: 'Virtual Broadcast Room',
      bookingCode: 'ASC27-AIC-0654',
      status: 'Confirmed',
    },
    {
      id: 'gst',
      title: 'GST Clinic: Notices & Appeals',
      date: '16 Jan 2027',
      venue: 'The Orchid, Mumbai',
      bookingCode: 'ASC27-GST-0695',
      status: 'Confirmed',
    },
  ];

  const [events, setEvents] = useState<MemberEvent[]>(memberEvents);
  const [offlineSynced, setOfflineSynced] = useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('ascend_offline_passes');
      if (stored) {
        const parsed: MemberEvent[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge unique by bookingCode
          const combined = [...parsed];
          memberEvents.forEach((ev) => {
            if (!combined.some((c) => c.bookingCode === ev.bookingCode)) {
              combined.push(ev);
            }
          });
          setEvents(combined);
          localStorage.setItem('ascend_offline_passes', JSON.stringify(combined));
        } else {
          localStorage.setItem('ascend_offline_passes', JSON.stringify(memberEvents));
        }
      } else {
        localStorage.setItem('ascend_offline_passes', JSON.stringify(memberEvents));
      }
      setOfflineSynced(true);
    } catch {
      setOfflineSynced(false);
    }
  }, []);

  const receipts: MemberReceipt[] = [
    {
      id: 'RCPT-0041',
      invoiceNo: 'ASC/26-27/0041',
      item: 'Core Annual Membership 2027',
      sacCode: '998399',
      taxable: 1000,
      cgst: 90,
      sgst: 90,
      amount: 1180,
      date: '03 Nov 2026',
    },
    {
      id: 'RCPT-0388',
      invoiceNo: 'ASC/26-27/0388',
      item: 'Launch Summit 2027 Admission Pass',
      sacCode: '998399',
      taxable: 999,
      cgst: 90,
      sgst: 90,
      amount: 1179,
      date: '04 Nov 2026',
    },
    {
      id: 'RCPT-0102',
      invoiceNo: 'ASC/26-27/0102',
      item: 'GST Clinic Registration Pass',
      sacCode: '998399',
      taxable: 299,
      cgst: 27,
      sgst: 27,
      amount: 353,
      date: '05 Nov 2026',
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Member profile updated and encrypted.');
  };

  return (
    <WebShell>
      <section className="max-w-[1200px] mx-auto px-5 md:px-8 py-14 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-8 md:gap-14 items-start">
          {/* Side Navigation */}
          <nav className="flex md:flex-col gap-1 border-b md:border-b-0 md:sticky md:top-24 border-[var(--line)] overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'events', label: 'My Event Passes' },
              { id: 'receipts', label: 'GST Tax Invoices' },
              { id: 'wings', label: 'My Active Wings' },
              { id: 'profile', label: 'Profile & Credentials' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-left py-2.5 px-3 md:px-0 text-[14.5px] cursor-pointer whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[var(--fg)] font-medium md:border-l-2 md:border-[var(--accent)] md:pl-3'
                      : 'text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Tab Content */}
          <div className="flex flex-col gap-10 min-w-0">
            {/* Header User Profile Banner */}
            <div className="p-6 md:p-8 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <span className="w-18 h-18 rounded-full bg-[linear-gradient(135deg,#0C1A58,#173196)] text-white text-[24px] font-semibold grid place-items-center shadow-lg border border-[var(--line)]">
                  KR
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <Heading level="h1" className="text-[26px] md:text-[32px]">
                      {profileData.name}
                    </Heading>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[rgba(18,144,127,0.15)] text-[var(--teal)] border border-[rgba(18,144,127,0.3)]">
                      ✓ ICAI Verified
                    </span>
                  </div>
                  <p className="text-[14px] text-[var(--muted)] mt-1">
                    MRN: <span className="font-mono text-[var(--fg)]">{profileData.mno}</span> · Founding Member · Valid till Dec 2027
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end text-left sm:text-right gap-1 font-mono text-[12px] text-[var(--muted)]">
                <span>Account Status: <strong className="text-[var(--success)]">ACTIVE</strong></span>
                <span>City Chapter: <strong className="text-[var(--fg)]">{profileData.city}</strong></span>
              </div>
            </div>

            {/* My Event Passes Tab */}
            {activeTab === 'events' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="font-display text-[20px] font-medium text-[var(--fg)]">
                    Upcoming Bookings & Passes
                  </h2>
                  {offlineSynced && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-mono bg-[rgba(184,255,44,0.1)] text-[var(--lime)] border border-[rgba(184,255,44,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lime)] animate-pulse" />
                      Offline Pass Storage Synced ({events.length} passes cached)
                    </span>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Booking Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead align="right">Digital Pass</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium text-[var(--fg)]">
                          {ev.title}
                        </TableCell>
                        <TableCell className="text-[var(--muted)]">{ev.date}</TableCell>
                        <TableCell className="font-mono text-[13px] text-[var(--accent)] font-semibold">
                          {ev.bookingCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="green">{ev.status}</Badge>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedPass(ev)}
                          >
                            View QR Pass
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* GST Tax Invoices Tab */}
            {activeTab === 'receipts' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-[20px] font-medium text-[var(--fg)]">
                    Statutory GST Invoices & Receipts (SAC 998399)
                  </h2>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead align="right">Amount</TableHead>
                      <TableHead align="right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((rcpt) => (
                      <TableRow key={rcpt.id}>
                        <TableCell className="font-mono text-[13px] text-[var(--muted)]">
                          {rcpt.invoiceNo}
                        </TableCell>
                        <TableCell className="font-medium text-[var(--fg)]">{rcpt.item}</TableCell>
                        <TableCell className="text-[var(--muted)]">{rcpt.date}</TableCell>
                        <TableCell align="right" className="font-mono font-medium text-[var(--fg)]">
                          ₹{rcpt.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice(rcpt)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => toast(`Generating PDF for ${rcpt.invoiceNo}...`)}
                            >
                              PDF ↓
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Active Wings Tab */}
            {activeTab === 'wings' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-display text-[20px] font-medium text-[var(--fg)] mb-1">
                    Specialized Wing Affiliations
                  </h2>
                  <p className="text-[14px] text-[var(--muted)]">
                    You have primary voting rights and committee participation in two wings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-3">
                    <span className="text-[12px] font-mono text-[#2F6FE4]">Wing 01 · Primary Wing</span>
                    <h3 className="font-display text-[18px] font-medium text-[var(--fg)]">Tax & Regulatory</h3>
                    <p className="text-[13px] text-[var(--muted)]">Direct Tax · International Tax · GST · Customs</p>
                    <div className="pt-3 border-t border-[var(--line)] text-[12px] font-mono text-[var(--accent)]">
                      Monthly Forum: Tax Update Live · 3rd Friday
                    </div>
                  </div>

                  <div className="p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-3">
                    <span className="text-[12px] font-mono text-[#14A89A]">Wing 05 · Secondary Wing</span>
                    <h3 className="font-display text-[18px] font-medium text-[var(--fg)]">AI, Technology & Automation</h3>
                    <p className="text-[13px] text-[var(--muted)]">AI for CAs · Automation · Digital Transformation</p>
                    <div className="pt-3 border-t border-[var(--line)] text-[12px] font-mono text-[var(--accent)]">
                      Monthly Forum: Automation Friday · 1st Friday
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8">
                <h2 className="font-display text-[20px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-4">
                  Edit Professional Credentials
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">Registered Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">ICAI Membership No. (MRN)</label>
                    <Input
                      value={profileData.mno}
                      disabled
                      className="opacity-70 cursor-not-allowed font-mono"
                    />
                    <span className="text-[11px] text-[var(--faint)] mt-1 block">Locked after official verification.</span>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">City Chapter</label>
                    <Input
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">Firm / Practice Entity</label>
                  <Input
                    value={profileData.firm}
                    onChange={(e) => setProfileData({ ...profileData, firm: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">Professional Bio</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[var(--surface-muted)] text-[var(--fg)] border border-[var(--line)] rounded-[var(--r)] px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">LinkedIn Profile URL</label>
                  <Input
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  />
                </div>

                <Button variant="primary" type="submit" className="self-start">
                  Save Changes
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* QR Pass Modal */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Digital Admission Pass"
          maxWidth="md"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <h3 className="font-display text-[20px] font-medium text-[var(--fg)]">
              {selectedPass.title}
            </h3>
            <p className="text-[14px] text-[var(--muted)]">
              {selectedPass.date} · {selectedPass.venue}
            </p>

            <div className="w-52 h-52 bg-white p-3 rounded-[var(--r)] grid place-items-center my-2 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-full h-full text-black fill-current">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v2h-2v-2zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-6-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
              </svg>
            </div>

            <div className="font-mono text-[15px] font-semibold text-[var(--accent)] bg-[var(--surface-muted)] px-4 py-2 rounded border border-[var(--line)]">
              {selectedPass.bookingCode}
            </div>

            <span className="text-[12px] font-mono text-[var(--faint)]">
              Present this code at venue reception for instant check-in.
            </span>

            <Button variant="secondary" onClick={() => window.print()} className="w-full mt-2">
              Print / Save Pass
            </Button>
          </div>
        </Modal>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNo}`}
          maxWidth="md"
        >
          <div className="flex flex-col gap-4 text-[14px]">
            <div className="border-b border-[var(--line)] pb-3">
              <span className="text-[var(--muted)] block text-[12px]">Item Description</span>
              <span className="font-medium text-[var(--fg)] text-[16px]">{selectedInvoice.item}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div>
                <span className="text-[var(--muted)] text-[12px] block">Invoice Date</span>
                <span className="font-mono text-[var(--fg)]">{selectedInvoice.date}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] text-[12px] block">HSN/SAC Code</span>
                <span className="font-mono text-[var(--fg)]">{selectedInvoice.sacCode}</span>
              </div>
            </div>

            <div className="p-4 rounded bg-[var(--surface-muted)] border border-[var(--line)] flex flex-col gap-2 font-mono text-[13px]">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span>₹{selectedInvoice.taxable}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>CGST (9%):</span>
                <span>₹{selectedInvoice.cgst}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>SGST (9%):</span>
                <span>₹{selectedInvoice.sgst}</span>
              </div>
              <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold text-[var(--fg)] text-[15px]">
                <span>Total Amount Paid:</span>
                <span className="text-[var(--accent)]">₹{selectedInvoice.amount}</span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                toast(`Downloading official signed invoice ${selectedInvoice.invoiceNo}...`);
                setSelectedInvoice(null);
              }}
              className="w-full mt-2"
            >
              Download Signed PDF Invoice ↓
            </Button>
          </div>
        </Modal>
      )}
    </WebShell>
  );
}
