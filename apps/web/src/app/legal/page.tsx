'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Button } from '@ascend/ui';
import { PROTOTYPE_LEGAL_DOCS } from '@ascend/shared';

export default function LegalPage() {
  const [selectedDoc, setSelectedDoc] = useState(PROTOTYPE_LEGAL_DOCS[0] || 'Privacy Policy');

  const policies: Record<string, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
    'Privacy Policy': {
      title: 'ASCEND CA Community Privacy Policy',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'We collect your name, email address, mobile number, ICAI Membership Registration Number (MRN), firm name, city, and billing details when you register as a member or attendee. All member credentials and sensitive fields are encrypted at rest using AES-256-GCM cryptography.',
        },
        {
          heading: '2. Purpose of Processing',
          body: 'Data is processed strictly to maintain the professional register, issue CPE attendance verifications, generate statutory GST tax invoices, deliver community communications via email/WhatsApp, and prevent unauthorized portal access.',
        },
        {
          heading: '3. Data Sharing & Third Parties',
          body: 'We do not sell member personal data to marketing vendors. Data is shared solely with Razorpay (payment processing), AWS/Cloudflare (hosting security), and regulatory authorities when mandated by Indian law.',
        },
        {
          heading: '4. Member Directory & Privacy Controls',
          body: 'Members can manage their directory visibility settings inside the Member Dashboard. By default, only verified name, firm, city, and active wings are visible to logged-in members. Mobile numbers and personal addresses are never exposed on public pages.',
        },
        {
          heading: '5. Grievance Redressal',
          body: 'In accordance with the Information Technology Act 2000 and Digital Personal Data Protection Act 2023, the designated Grievance Officer is CA Abhinav Aggarwal (grievance@ascendca.in).',
        },
      ],
    },
    'Terms & Conditions': {
      title: 'Platform Terms & Community Code of Conduct',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          body: 'By accessing ASCEND CA Community web platforms, mobile applications, or attending physical wing summits, you agree to be bound by these Terms and all applicable statutory regulations under the Institute of Chartered Accountants of India (ICAI).',
        },
        {
          heading: '2. Membership Eligibility',
          body: 'Core Membership is open exclusively to qualified Chartered Accountants holding valid ICAI membership. Associate Membership is available to allied finance, tax, and legal professionals. Student Membership requires verification of active CA Foundation, Inter, or Final registration.',
        },
        {
          heading: '3. Professional Conduct',
          body: 'Members shall uphold the highest standards of professional etiquette. Commercial solicitation, unapproved advertising in community forums, or inappropriate conduct will result in immediate suspension under our zero-tolerance policy.',
        },
        {
          heading: '4. Intellectual Property',
          body: 'All study materials, masterclass recordings, presentation decks, and digital tools published on ASCEND are protected by copyright. Unauthorized redistribution or commercial sale is strictly prohibited.',
        },
      ],
    },
    'Event Registration Terms': {
      title: 'Event Registration & Attendance Guidelines',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Registration Confirmation',
          body: 'Registration is confirmed only upon successful payment receipt and generation of a unique Booking Code (e.g., ASC27-LAU-0613). A digital admission pass with a verifiable QR code will be issued instantly.',
        },
        {
          heading: '2. Check-in Requirements',
          body: 'Attendees at physical venues must present their digital pass QR code alongside a government photo ID or ICAI membership card at the check-in reception.',
        },
        {
          heading: '3. Badge Non-Transferability',
          body: 'Summit passes are non-transferable unless requested in writing to events@ascendca.in at least 72 hours before the scheduled commencement.',
        },
      ],
    },
    'Cancellation & Refund': {
      title: 'Cancellation & Refund Policy',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Event Ticket Cancellations',
          body: 'Cancellations requested more than 7 days prior to an offline event will receive an 80% refund (20% retained for venue and catering commitments). Cancellations within 7 days are non-refundable, but ticket transfer to a fellow member may be requested.',
        },
        {
          heading: '2. Virtual Sessions',
          body: 'Registrations for online workshops are eligible for full credit transfer to a subsequent workshop if notice is provided 24 hours prior to the broadcast.',
        },
        {
          heading: '3. Annual Membership Subscriptions',
          body: 'Annual membership subscriptions are non-refundable once approved and processed, as community platform access is granted immediately upon verification.',
        },
        {
          heading: '4. Refund Processing Time',
          body: 'Approved refunds are credited back to the original payment source (UPI account or card) within 5 to 7 banking days via Razorpay.',
        },
      ],
    },
    'Payment Terms': {
      title: 'Payment & Statutory Billing Terms',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Currency & Pricing',
          body: 'All platform fees and summit tickets are quoted in Indian Rupees (INR). Applicable Goods & Services Tax (GST) is computed on the server and detailed on the checkout screen.',
        },
        {
          heading: '2. Tax Invoices & HSN/SAC Code',
          body: 'A valid GST Tax Invoice with SAC Code 998399 is automatically generated and downloadable from your Member Dashboard immediately after payment.',
        },
        {
          heading: '3. Input Tax Credit (ITC)',
          body: 'To claim Input Tax Credit, members or corporate firms must provide a valid 15-digit GSTIN at checkout. GSTIN details cannot be altered once an invoice is finalized and logged with the tax authority.',
        },
      ],
    },
    'Cookie Policy': {
      title: 'Cookie & Local Storage Policy',
      lastUpdated: '1 November 2026',
      sections: [
        {
          heading: '1. Necessary Cookies',
          body: 'We use strictly necessary httpOnly cookies (__Host-ascend_member_sess) to maintain secure, tamper-proof user sessions.',
        },
        {
          heading: '2. Preferences & Theme Tokens',
          body: 'We utilize localStorage to remember your active visual theme settings (Dark/Light mode) without tracking your cross-site browsing activity.',
        },
      ],
    },
  };

  const currentPolicy = policies[selectedDoc] || policies['Privacy Policy']!;

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Governance</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Policies &{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
              legal terms.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Statutory compliance, data protection standards, and community guidelines governing ASCEND CA Community.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-1.5 p-3 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--faint)] px-3 py-2">
                Legal Documents
              </span>
              {PROTOTYPE_LEGAL_DOCS.map((doc) => (
                <button
                  key={doc}
                  onClick={() => setSelectedDoc(doc)}
                  className={`text-left px-4 py-3 rounded-[calc(var(--r)-2px)] text-[14.5px] font-medium transition-all ${
                    selectedDoc === doc
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>

          {/* Reader Window */}
          <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-12">
            <div className="border-b border-[var(--line)] pb-6 mb-8 flex flex-wrap justify-between items-baseline gap-4">
              <div>
                <h2 className="font-display text-[26px] md:text-[32px] font-medium tracking-tight text-[var(--fg)]">
                  {currentPolicy.title}
                </h2>
                <span className="font-mono text-[13px] text-[var(--muted)] mt-1 block">
                  Last Updated: {currentPolicy.lastUpdated} · Version 2026.1
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="print:hidden font-mono text-[12px]"
              >
                Print Document
              </Button>
            </div>

            <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-[var(--fg)] font-light">
              {currentPolicy.sections.map((section, sIdx) => (
                <div key={sIdx} className="flex flex-col gap-2.5">
                  <h3 className="font-display text-[19px] font-medium tracking-tight text-[var(--fg)]">
                    {section.heading}
                  </h3>
                  <p className="text-[var(--muted)] leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--line)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[13px] text-[var(--faint)]">
              <span>ASCEND CA Community Secretariat</span>
              <span className="font-mono">CIN: U85300DL2026NPL401920</span>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
