'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, PricingTierCard, Button } from '@ascend/ui';
import { PROTOTYPE_MEMBERSHIP_TIERS } from '@ascend/shared';

export default function MembershipPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Who can become a member of ASCEND?',
      a: 'Core membership is open to all qualified Chartered Accountants holding a valid ICAI Membership Registration Number (MRN). Associate membership is designed for allied legal, finance, and tax practitioners. Student membership is open to registered CA Foundation, Intermediate, and Final students.',
    },
    {
      q: 'How does verification work?',
      a: 'During sign-up, you submit your basic credentials and ICAI MRN. Our verification engine validates credentials against the professional register. All sensitive records are encrypted at rest with AES-256-GCM cryptography.',
    },
    {
      q: 'Can I participate in multiple wings?',
      a: 'Yes. Every member can affiliate with their primary wing of specialization and attend open sessions, clinics, and forums hosted by all ten wings throughout the year.',
    },
    {
      q: 'Are GST invoices provided for membership and event fees?',
      a: 'Yes. An official GST Tax Invoice under SAC Code 998399 is instantly generated and downloadable from your Member Dashboard immediately after payment receipt.',
    },
    {
      q: 'What is the founding member benefit?',
      a: 'The first 500 members obtain Founding Member status, reserved seating at the annual National Summit, commemorative recognition on the national roll, and priority nomination for wing committee panels.',
    },
  ];

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Membership</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Invest in your{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              profession.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Choose the membership tier aligned with your professional status. Transparent annual fees with complete wing access.
          </p>
        </div>
      </section>

      {/* Pricing Tiers Grid */}
      <section className="py-20 md:py-28 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PROTOTYPE_MEMBERSHIP_TIERS.map((tier) => (
            <PricingTierCard
              key={tier.name}
              name={tier.name}
              subtitle={tier.subtitle}
              price={tier.price}
              features={tier.features}
              featured={tier.featured}
              onSelect={() => router.push(`/login?mode=register&tier=${tier.name.toLowerCase()}`)}
            />
          ))}
        </div>
      </section>

      {/* Founding Member Spotlight */}
      <section className="pb-20 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="p-8 md:p-12 rounded-[var(--r)] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(15,56,192,0.2),rgba(6,10,31,0.9))] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[12px] uppercase tracking-wider text-[var(--accent)] font-semibold">
              Limited Availability
            </span>
            <h2 className="font-display text-[26px] md:text-[32px] font-medium text-[var(--fg)]">
              Founding Member Status
            </h2>
            <p className="text-[15px] text-[var(--muted)] max-w-[50ch] leading-relaxed">
              The first 500 verified members are permanently enshrined on the National Foundation Roll and receive guaranteed priority passes to the annual National Launch Summit.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/login?mode=register&tier=core')}
            className="whitespace-nowrap"
          >
            Claim Founding Seat →
          </Button>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="pb-28 max-w-[900px] mx-auto px-5 md:px-8">
        <div className="text-center mb-14">
          <Eyebrow pill>Clarity</Eyebrow>
          <Heading level="h2" className="mt-4">
            Frequently asked questions.
          </Heading>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 font-display text-[17px] font-medium text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
              >
                <span>{faq.q}</span>
                <span className="font-mono text-[18px] text-[var(--muted)]">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>

              {openFaq === idx && (
                <div className="px-6 pb-6 pt-1 text-[14.5px] text-[var(--muted)] leading-relaxed border-t border-[var(--line)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </WebShell>
  );
}
