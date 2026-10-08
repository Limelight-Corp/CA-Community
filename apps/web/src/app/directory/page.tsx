'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Input, Select, getInitials } from '@ascend/ui';
import { PROTOTYPE_WINGS } from '@ascend/shared';

export default function DirectoryPage() {
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cities = ['All', 'New Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Gurugram', 'Jaipur'];

  // Seeded directory members based on prototype data and community leaders
  const directoryMembers = [
    {
      id: 'm1',
      name: 'CA Sandeep Garg',
      firm: 'Garg & Co., Chartered Accountants',
      city: 'New Delhi',
      specialization: 'Corporate Governance & Direct Tax',
      mnoMasked: '084***',
      tier: 'Founding Core',
      wingNumber: 1,
      verified: true,
    },
    {
      id: 'm2',
      name: 'CA Abhinav Aggarwal',
      firm: 'Aggarwal & Associates',
      city: 'New Delhi',
      specialization: 'Audit & Forensic Accounting',
      mnoMasked: '512***',
      tier: 'Founding Core',
      wingNumber: 2,
      verified: true,
    },
    {
      id: 'm3',
      name: 'CA Rohan Mehta',
      firm: 'Mehta Global Advisory',
      city: 'Mumbai',
      specialization: 'International Tax & Outbound Structuring',
      mnoMasked: '528***',
      tier: 'Core Member',
      wingNumber: 1,
      verified: true,
    },
    {
      id: 'm4',
      name: 'CA Priya Sharma',
      firm: 'Sharma Assurance LLP',
      city: 'Bengaluru',
      specialization: 'Statutory Audit & Ind AS Standards',
      mnoMasked: '541***',
      tier: 'Core Member',
      wingNumber: 2,
      verified: true,
    },
    {
      id: 'm5',
      name: 'CA Neha Kapoor',
      firm: 'FinTech Capital Group',
      city: 'New Delhi',
      specialization: 'Corporate Finance & Board Readiness',
      mnoMasked: '533***',
      tier: 'Core Member',
      wingNumber: 4,
      verified: true,
    },
    {
      id: 'm6',
      name: 'CA Arjun Verma',
      firm: 'AuditFlow Technologies',
      city: 'Gurugram',
      specialization: 'AI Automation & Practice Tech',
      mnoMasked: '562***',
      tier: 'Core Member',
      wingNumber: 5,
      verified: true,
    },
    {
      id: 'm7',
      name: 'CA Ishita Kulkarni',
      firm: 'Kulkarni Tax Chambers',
      city: 'Pune',
      specialization: 'GST Litigation & Appellate Matters',
      mnoMasked: '519***',
      tier: 'Core Member',
      wingNumber: 1,
      verified: true,
    },
    {
      id: 'm8',
      name: 'CA Siddharth Bansal',
      firm: 'Bansal & Partners LLP',
      city: 'Jaipur',
      specialization: 'Practice Growth & Advisory Strategy',
      mnoMasked: '097***',
      tier: 'Core Member',
      wingNumber: 3,
      verified: true,
    },
  ];

  const filteredMembers = directoryMembers.filter((m) => {
    const matchesCity = selectedCity === 'All' || m.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.firm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>National Roll</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Member{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              directory.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Pan-India network of verified Chartered Accountants and corporate leaders across all ten specialized wings.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="py-8 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="w-full md:w-64">
            <Select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              options={cities.map((c) => ({ value: c, label: c === 'All' ? 'All Cities' : c }))}
            />
          </div>

          <div className="w-full md:w-80">
            <Input
              placeholder="Search by name, firm, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="flex justify-between items-center mb-8">
          <span className="font-mono text-[13px] text-[var(--muted)]">
            Showing {filteredMembers.length} verified practitioners
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const wing = PROTOTYPE_WINGS.find((w) => w.number === member.wingNumber);

            return (
              <div
                key={member.id}
                className="group p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-elevated)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[linear-gradient(135deg,#0C1A58,#173196)] border border-[var(--line)] flex-shrink-0 grid place-items-center text-[18px] font-medium text-white shadow-sm">
                      {getInitials(member.name)}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[rgba(18,144,127,0.15)] text-[var(--teal)] border border-[rgba(18,144,127,0.3)]">
                        ✓ ICAI Verified
                      </span>
                      <span className="font-mono text-[11px] text-[var(--faint)]">
                        MRN: {member.mnoMasked}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-[19px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors mb-1">
                    {member.name}
                  </h3>

                  <p className="text-[13.5px] font-medium text-[var(--muted)] mb-1">
                    {member.firm}
                  </p>

                  <span className="font-mono text-[12px] text-[var(--faint)] block mb-4">
                    {member.city}
                  </span>

                  <div className="pt-3 border-t border-[var(--line)]">
                    <span className="text-[12px] text-[var(--muted)] block mb-2 line-clamp-1">
                      {member.specialization}
                    </span>

                    {wing && (
                      <span
                        className="inline-block text-[11px] font-mono px-2 py-0.5 rounded border"
                        style={{ borderColor: `${wing.color}44`, color: wing.color, backgroundColor: `${wing.color}11` }}
                      >
                        Wing {wing.number}: {wing.name.split('&')[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--line)] flex items-center justify-between text-[12px]">
                  <span className="font-mono text-[var(--muted)]">{member.tier}</span>
                  <a
                    href="mailto:connect@ascendca.in"
                    className="font-mono text-[var(--accent)] hover:underline"
                  >
                    Send message ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </WebShell>
  );
}
