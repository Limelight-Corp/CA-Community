import React from 'react';
import type { Metadata } from 'next';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { AccentText, Container, Kicker } from '@ascend/ui';
import { getSettings } from '../../lib/community-store';
import { googleMapsEmbedUrl, safeUrl } from '../../lib/content';
import { PageHero, Section } from '../../components/content/ui';
import { ContactForm } from '../../components/content/ContactForm';
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from '../../components/site/SocialIcon';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Contact Us',
    description: `Get in touch with ${siteName} — questions about membership, events, partnerships or speaking. Send us a message and our team will respond.`,
    alternates: { canonical: '/contact' },
  };
}

export default function ContactPage() {
  const settings = getSettings();
  const { contact } = settings;
  const mapLink = safeUrl(contact.mapUrl);
  const mapEmbed = googleMapsEmbedUrl(contact.mapUrl, contact.address);
  const socials = (Object.entries(settings.social) as [SocialKey, string | undefined][])
    .map(([k, url]) => [k, safeUrl(url)] as const)
    .filter((entry): entry is readonly [SocialKey, string] => !!entry[1]);

  const channels = [
    contact.email && { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, '')}` },
    contact.address && { icon: MapPin, label: 'Address', value: contact.address, href: mapLink },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Say"
        accent="hello."
        lead="Questions about membership, events, partnerships or speaking at a wing session? Drop us a line — a real person will reply."
        ghost="HELLO"
      />

      <Section labelledBy="contact-form-heading">
        <Container size="wide" className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* Details */}
          <div className="flex flex-col gap-6">
            {channels.length > 0 && (
              <ul className="flex flex-col gap-3">
                {channels.map(({ icon: Icon, label, value, href }) => {
                  const body = (
                    <>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
                        <span className="break-words font-display text-[clamp(18px,2vw,24px)] font-medium tracking-[-0.03em] text-[var(--fg)]">{value}</span>
                      </span>
                      {href && <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-gold" aria-hidden />}
                    </>
                  );
                  const cls = 'group flex items-center gap-4 rounded-[24px] border border-mist/[0.1] bg-grad-surface p-5 transition hover:border-gold/40';
                  return (
                    <li key={label}>
                      {href ? (
                        <a href={href} className={cls} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                          {body}
                        </a>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {mapEmbed ? (
              <div className="overflow-hidden rounded-[24px] border border-mist/[0.1]">
                <iframe
                  title={`Map${contact.address ? ` of ${contact.address}` : ''}`}
                  src={mapEmbed}
                  className="aspect-[4/3] w-full grayscale-[0.4] invert-[0.9] hue-rotate-180"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-mist/[0.16] px-5 py-3 text-[14px] font-semibold text-[var(--fg)] hover:border-gold/60 hover:text-gold"
                >
                  <MapPin className="h-4 w-4" aria-hidden /> Open in maps
                </a>
              )
            )}

            {socials.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Follow along</h2>
                <ul className="flex flex-wrap gap-2">
                  {socials.map(([key, url]) => (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-mist/[0.14] px-4 py-2.5 text-[13.5px] text-[var(--fg)] transition hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                      >
                        <SocialIcon name={key} className="h-4 w-4" />
                        {SOCIAL_LABELS[key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto hidden rounded-[24px] border border-gold/25 bg-gold/[0.06] p-6 lg:block">
              <p className="font-display text-[22px] font-medium leading-snug tracking-[-0.03em] text-[var(--fg)]">
                Want to speak, partner or host a city chapter? <AccentText tone="gold">Tell us in the form.</AccentText>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-[32px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-8 md:p-12">
            <Kicker>Send a message</Kicker>
            <h2 id="contact-form-heading" className="mb-8 mt-4 font-display text-[clamp(30px,3.6vw,48px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
              How can we <AccentText>help?</AccentText>
            </h2>
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
