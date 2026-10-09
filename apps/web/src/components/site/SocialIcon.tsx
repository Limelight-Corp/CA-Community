import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export type SocialKey = 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'x';

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
};

export function SocialIcon({ name, className }: { name: SocialKey; className?: string }) {
  switch (name) {
    case 'linkedin':
      return <Linkedin className={className} aria-hidden />;
    case 'instagram':
      return <Instagram className={className} aria-hidden />;
    case 'facebook':
      return <Facebook className={className} aria-hidden />;
    case 'youtube':
      return <Youtube className={className} aria-hidden />;
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
  }
}
