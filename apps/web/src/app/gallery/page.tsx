'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Badge, Modal, ImageIcon } from '@ascend/ui';

interface GalleryItem {
  id: string;
  title: string;
  category: 'Conferences' | 'Masterclasses' | 'Sports' | 'Social';
  date: string;
  location: string;
  aspect: string;
  accentGradient: string;
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Conferences', 'Masterclasses', 'Sports', 'Social'];

  const photos: GalleryItem[] = [
    {
      id: 'g1',
      title: 'National Tax Summit Opening Plenary',
      category: 'Conferences',
      date: 'January 2027',
      location: 'Bharat Mandapam, New Delhi',
      aspect: 'aspect-[4/3]',
      accentGradient: 'from-[#0C1A58] via-[#10298A] to-[#04081E]',
    },
    {
      id: 'g2',
      title: 'Young CA Speed Networking Lounge',
      category: 'Social',
      date: 'December 2026',
      location: 'Koramangala, Bengaluru',
      aspect: 'aspect-[1/1]',
      accentGradient: 'from-[#2B0E4D] via-[#481E7F] to-[#0D0517]',
    },
    {
      id: 'g3',
      title: 'AI Audit Lab Hands-on Coding Session',
      category: 'Masterclasses',
      date: 'November 2026',
      location: 'Gurugram Tech Center',
      aspect: 'aspect-[16/10]',
      accentGradient: 'from-[#0A3D36] via-[#12665C] to-[#031512]',
    },
    {
      id: 'g4',
      title: 'CA Premier Cricket League Finals',
      category: 'Sports',
      date: 'February 2027',
      location: 'Gymkhana Grounds, Mumbai',
      aspect: 'aspect-[4/3]',
      accentGradient: 'from-[#14307A] via-[#1D49BB] to-[#081333]',
    },
    {
      id: 'g5',
      title: 'Women Who Lead Executive Circle',
      category: 'Social',
      date: 'November 2026',
      location: 'Taj Lands End, Mumbai',
      aspect: 'aspect-[16/9]',
      accentGradient: 'from-[#4D0D40] via-[#7B1968] to-[#140210]',
    },
    {
      id: 'g6',
      title: 'GST Appellate Clinic & Case Discussion',
      category: 'Masterclasses',
      date: 'October 2026',
      location: 'The Orchid, Pune',
      aspect: 'aspect-[1/1]',
      accentGradient: 'from-[#502208] via-[#853C12] to-[#170902]',
    },
  ];

  const filteredPhotos =
    activeCategory === 'All'
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Moments</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Community{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              gallery.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Snapshots of our summits, specialized wing labs, cricket leagues, and local city chapter meetups.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-[var(--r-full)] text-[13px] font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Photo Grid */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredPhotos.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="break-inside-avoid group cursor-pointer overflow-hidden rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] transition-all flex flex-col"
            >
              <div
                className={`w-full ${item.aspect} bg-gradient-to-br ${item.accentGradient} relative flex items-center justify-center overflow-hidden`}
              >
                <ImageIcon
                  size={42}
                  className="text-white/20 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[13px] font-mono">
                  View Moment ↗
                </div>
              </div>

              <div className="p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12px]">
                  <Badge variant="blue">{item.category}</Badge>
                  <span className="font-mono text-[var(--muted)]">{item.date}</span>
                </div>
                <h3 className="font-display text-[16px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
                  {item.title}
                </h3>
                <span className="font-mono text-[12px] text-[var(--faint)]">
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={selectedPhoto.title}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-4">
            <div
              className={`w-full aspect-[16/10] rounded-[var(--r)] bg-gradient-to-br ${selectedPhoto.accentGradient} flex items-center justify-center relative`}
            >
              <ImageIcon size={64} className="text-white/30" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--line)]">
              <div>
                <Badge variant="blue">{selectedPhoto.category}</Badge>
                <p className="text-[14px] text-[var(--muted)] mt-1">{selectedPhoto.location}</p>
              </div>
              <span className="font-mono text-[13px] text-[var(--fg)]">{selectedPhoto.date}</span>
            </div>
          </div>
        </Modal>
      )}
    </WebShell>
  );
}
