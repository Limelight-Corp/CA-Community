'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Badge, ArrowIcon } from '@ascend/ui';
import { useCommunityData } from '../../lib/useCommunityData';

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useCommunityData(true);
  const newsList = data.news || [];

  const categories = ['All', 'Announcement', 'Community', 'Chapters'];

  // Helper to slugify titles
  const getSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const filteredNews = newsList.filter((item) => {
    if (item.isPublished === false) return false;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>News & Dispatches</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Official{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
              announcements.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Latest operational updates, executive council appointments, and community rollouts across India.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="py-10 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-[var(--r-full)] text-[13px] font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-muted)] text-[var(--fg)] border border-[var(--line)] rounded-[var(--r)] px-3.5 py-2 text-[14px] outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--faint)]"
            />
          </div>
        </div>
      </section>

      {/* News List */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredNews.map((item, idx) => {
            const slug = getSlug(item.title);
            return (
              <Link
                key={idx}
                href={`/news/${slug}`}
                className="group flex flex-col justify-between p-7 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-elevated)] transition-all"
              >
                <div>
                  {item.coverImageUrl && (
                    <div className="w-full h-44 rounded-lg overflow-hidden mb-4 border border-[var(--line)]">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <Badge variant="blue">{item.category}</Badge>
                    <span className="font-mono text-[12px] text-[var(--muted)]">{item.date}</span>
                  </div>

                  <h2 className="font-display text-[22px] font-medium tracking-tight text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mb-3">
                    {item.title}
                  </h2>

                  <p className="text-[14px] text-[var(--muted)] leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--line)] flex items-center text-[13.5px] font-medium text-[var(--accent)] gap-1.5 group-hover:gap-2.5 transition-all">
                  <span>Read dispatch</span>
                  <ArrowIcon size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </WebShell>
  );
}
