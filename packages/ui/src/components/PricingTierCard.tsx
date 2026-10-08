import React from 'react';
import { CheckIcon } from './icons';
import { Button } from './Button';
import { Eyebrow } from './Typography';
import { cn } from '../utils';

export interface PricingTierProps {
  name: string;
  subtitle: string;
  price: number;
  featured?: boolean;
  features: string[];
  ctaLabel?: string;
  onSelect?: () => void;
  className?: string;
}

export const PricingTierCard: React.FC<PricingTierProps> = ({
  name,
  subtitle,
  price,
  featured = false,
  features,
  ctaLabel,
  onSelect,
  className,
}) => {
  return (
    <div
      className={cn(
        'border border-[var(--line)] rounded-[var(--r)] p-8 flex flex-col gap-5.5 transition-all duration-200',
        featured
          ? 'bg-[radial-gradient(120%_90%_at_100%_0%,#2F5BFF_0%,#0F38C0_35%,#0C1A58_75%)] text-white border-[rgba(157,182,255,0.35)] shadow-[0_30px_60px_-30px_rgba(47,91,255,0.8)]'
          : 'bg-[linear-gradient(180deg,rgba(219,231,240,0.05),rgba(219,231,240,0.015)),var(--card)] text-[var(--fg)]',
        className
      )}
    >
      <div>
        <Eyebrow className={featured ? 'text-[var(--sky)]' : 'text-[var(--muted)]'}>
          {subtitle}
        </Eyebrow>
        <h3 className="font-display text-[26px] font-medium tracking-tight mt-3.5">
          {name}
        </h3>
      </div>

      <div className="font-display text-[52px] font-normal tracking-[-0.05em] leading-none">
        ₹{price.toLocaleString('en-IN')}
        <small className="font-mono text-[13px] text-[var(--muted)] tracking-normal ml-1.5">
          / year
        </small>
      </div>

      <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-[14.5px] text-[var(--muted)] flex-1 my-2">
        {features.map((feat, idx) => (
          <li
            key={idx}
            className={cn('flex items-start gap-2.5', featured && 'text-[var(--on-ink-muted)]')}
          >
            <CheckIcon
              size={16}
              className={cn('mt-0.5 flex-none', featured ? 'text-[var(--sky)]' : 'text-[var(--lime)]')}
            />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? 'lime' : 'line'}
        fullWidth
        onClick={onSelect}
        className="mt-auto"
      >
        {ctaLabel || `Choose ${name}`}
      </Button>
    </div>
  );
};
