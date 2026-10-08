'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WebShell } from '../../../components/WebShell';
import { Heading, Eyebrow, Badge, Button, BackIcon, useToast } from '@ascend/ui';
import { PROTOTYPE_NEWS } from '@ascend/shared';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params?.slug as string;

  const getSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const article = PROTOTYPE_NEWS.find((item) => getSlug(item.title) === slug) || PROTOTYPE_NEWS[0]!;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('Article link copied to clipboard!');
    }
  };

  return (
    <WebShell>
      {/* Article Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[860px] mx-auto px-5 md:px-8">
          <button
            onClick={() => router.push('/news')}
            className="inline-flex items-center gap-2 text-[13px] font-mono text-[var(--muted)] hover:text-[var(--fg)] mb-8 transition-colors"
          >
            <BackIcon size={14} />
            <span>Back to Dispatches</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Badge variant="blue">{article.category}</Badge>
            <span className="font-mono text-[13px] text-[var(--muted)]">{article.date}</span>
          </div>

          <Heading level="h1" className="text-[clamp(34px,4.5cqi,58px)] leading-[1.15] mb-6">
            {article.title}
          </Heading>

          <div className="flex items-center justify-between border-t border-[var(--line)] pt-6 text-[13.5px] text-[var(--muted)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--surface-muted)] border border-[var(--line)] grid place-items-center font-serif text-[14px] text-[var(--fg)]">
                AS
              </div>
              <div>
                <span className="block font-medium text-[var(--fg)]">ASCEND Secretariat</span>
                <span className="block text-[12px] text-[var(--muted)]">Official Dispatch</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleShare} className="font-mono text-[12px]">
              Share Article
            </Button>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 md:py-24 max-w-[860px] mx-auto px-5 md:px-8">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-14">
          <p className="text-[20px] font-light leading-relaxed text-[var(--fg)] mb-8 pb-8 border-b border-[var(--line)]">
            {article.summary}
          </p>

          <div className="text-[16px] leading-[1.8] text-[var(--muted)] flex flex-col gap-6">
            <p>{article.content}</p>
            <p>
              For formal queries regarding this bulletin, accredited members may submit inquiries via
              the national contact desk or reach out directly to the Secretariat Executive Committee.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--line)] flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Eyebrow>Topic:</Eyebrow>
              <span className="font-mono text-[13px] text-[var(--fg)]">{article.category}</span>
            </div>

            <Link href="/news">
              <Button variant="secondary" size="sm">
                View all announcements
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
