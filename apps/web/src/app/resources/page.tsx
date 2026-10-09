'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Badge, Button, Input, useToast } from '@ascend/ui';
import { useCommunityData } from '../../lib/useCommunityData';

export default function ResourcesPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data } = useCommunityData(true);
  const rawResources = data.resources || [];

  const categories = ['All', 'Tax updates', 'Guides', 'Practice', 'Career', 'Webinars'];

  const resourcesWithStats = rawResources
    .filter((r) => r.isPublished !== false)
    .map((r, i) => ({
      ...r,
      id: r.id || `res-${i + 1}`,
      downloads: r.downloads ?? 140 + i * 87,
      isMembersOnly: r.isMembersOnly ?? i > 1,
    }));

  const filteredResources = resourcesWithStats.filter((r) => {
    const matchesCat = selectedCategory === 'All' || r.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.format.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (res: typeof resourcesWithStats[0]) => {
    setDownloadingId(res.id);
    setTimeout(() => {
      setDownloadingId(null);
      toast(`Downloading "${res.title}" (${res.format})...`);
    }, 700);
  };

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Knowledge Bank</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Practice{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
              resources.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Curated prompt libraries, practice pricing models, Ind AS case guides, and budget executive briefs.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="py-8 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-[var(--r-full)] text-[13px] font-medium transition-all ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        {filteredResources.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8">
            <h3 className="font-display text-[20px] font-medium text-[var(--fg)] mb-2">
              No resources found
            </h3>
            <p className="text-[14.5px] text-[var(--muted)]">
              No files matched your search criteria. Try choosing "All" or a different keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="group p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-elevated)] transition-all flex flex-col justify-between"
              >
                <div>
                  {res.fileUrl && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3 border border-[var(--line)]">
                      <img
                        src={res.fileUrl}
                        alt={res.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="blue">{res.category}</Badge>
                    <span className="font-mono text-[12px] text-[var(--muted)]">
                      {res.format}
                    </span>
                  </div>

                  <h3 className="font-display text-[18px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors mb-2">
                    {res.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] mt-3">
                    <span className="font-mono">{res.downloads} downloads</span>
                    {res.isMembersOnly && (
                      <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-medium">
                        Member Access
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--line)] flex justify-between items-center">
                  <span className="font-mono text-[11px] text-[var(--faint)]">
                    VERIFIED ASSET
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={downloadingId === res.id}
                    onClick={() => handleDownload(res)}
                  >
                    {downloadingId === res.id ? 'Fetching...' : 'Download File ↓'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </WebShell>
  );
}
