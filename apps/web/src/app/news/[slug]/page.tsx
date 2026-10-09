import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { CommunityNews } from '@ascend/shared';
import { Container, Kicker } from '@ascend/ui';
import { getItems, getSettings } from '../../../lib/community-store';
import { formatDisplayDate, generatedGradient, isoDate, safeUrl, sortByDateDesc, truncate } from '../../../lib/content';
import { jsonLd, siteUrl } from '../../../lib/seo';
import { ShareButtons } from '../../../components/content/ShareButtons';

type Params = Promise<{ slug: string }>;

function findArticle(slug: string) {
  return getItems<CommunityNews>('news', true).find((n) => n.slug === slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return { title: 'Article not found' };
  const description = truncate(article.summary || article.content, 160);
  const image = safeUrl(article.coverImageUrl);
  return {
    title: article.title,
    description,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      publishedTime: isoDate(article.date),
      ...(article.author ? { authors: [article.author] } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const { siteName } = getSettings();
  const url = `${siteUrl()}/news/${article.slug}`;
  const image = safeUrl(article.coverImageUrl);
  const absImage = image ? (image.startsWith('/') ? `${siteUrl()}${image}` : image) : undefined;
  const related = sortByDateDesc(getItems<CommunityNews>('news', true).filter((n) => n.slug !== article.slug)).slice(0, 3);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    datePublished: isoDate(article.date),
    mainEntityOfPage: url,
    articleSection: article.category,
    ...(absImage ? { image: [absImage] } : {}),
    author: article.author ? { '@type': 'Person', name: article.author } : { '@type': 'Organization', name: siteName },
    publisher: { '@type': 'Organization', name: siteName, logo: { '@type': 'ImageObject', url: `${siteUrl()}/icon.svg` } },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleLd) }} />

      <header className="relative overflow-hidden pt-10 md:pt-16">
        <Container size="narrow">
          <Link href="/news" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] hover:text-[var(--fg)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All news
          </Link>
          <div className="mt-10 flex flex-col gap-6">
            <Kicker tone="gold">{article.category}</Kicker>
            <h1 className="text-balance font-display text-[clamp(38px,6.4vw,84px)] font-medium leading-[0.96] tracking-[-0.05em] text-[var(--fg)]">{article.title}</h1>
            <p className="text-[clamp(17px,1.6vw,21px)] leading-relaxed text-[var(--muted)]">{article.summary}</p>
            <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
              <time dateTime={isoDate(article.date)}>{formatDisplayDate(article.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              <span> · {article.author || siteName}</span>
            </p>
          </div>
        </Container>
        <Container size="wide" className="mt-12">
          <div className="relative aspect-[16/8] overflow-hidden rounded-[32px] border border-mist/[0.1]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`Featured image: ${article.title}`} className="h-full w-full object-cover" />
            ) : (
              <div className="grain h-full w-full" style={{ background: generatedGradient(article.slug) }} aria-hidden>
                <span className="text-outline absolute bottom-[-0.15em] left-6 font-display text-[clamp(90px,18vw,260px)] font-semibold leading-none tracking-[-0.06em] opacity-60">
                  {siteName}
                </span>
              </div>
            )}
          </div>
        </Container>
      </header>

      <Container size="narrow" className="py-14 md:py-20">
        <div className="flex flex-col gap-6 text-[clamp(17px,1.4vw,19px)] leading-[1.75] text-[var(--fg)]">
          {article.content.split(/\n{2,}|\r\n\r\n/).map((para, i) => (
            <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[72px] first-letter:leading-[0.8] first-letter:text-gold' : undefined}>
              {para}
            </p>
          ))}
        </div>
        <div className="mt-14 border-t border-[var(--line)] pt-8">
          <ShareButtons url={url} title={article.title} />
        </div>
      </Container>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-[var(--line)] py-16 md:py-24">
          <Container size="wide">
            <h2 id="related-heading" className="font-display text-[clamp(30px,4vw,52px)] font-medium tracking-[-0.045em] text-[var(--fg)]">
              More updates
            </h2>
            <ul className="mt-8 border-t border-[var(--line)]">
              {related.map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}`} className="group grid gap-2 border-b border-[var(--line)] py-6 md:grid-cols-[10rem_1fr_auto] md:items-center md:gap-8">
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">{formatDisplayDate(n.date)}</span>
                    <span className="font-display text-[clamp(20px,2.2vw,28px)] font-medium tracking-[-0.03em] text-[var(--fg)] transition-transform duration-300 group-hover:translate-x-2">
                      {n.title}
                    </span>
                    <ArrowUpRight className="hidden h-6 w-6 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-gold md:block" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </article>
  );
}
