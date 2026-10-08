import React from 'react';
import { cn } from '../utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: 'ok' | 'warn' | 'muted';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  trendColor = 'ok',
  className,
}) => {
  const trendColorClass = {
    ok: 'text-[var(--ok)]',
    warn: 'text-[var(--warn)]',
    muted: 'text-[var(--muted)]',
  }[trendColor];

  return (
    <div className={cn('p-6 text-[var(--fg)] flex flex-col justify-between', className)}>
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
      <b className="font-display text-[30px] md:text-[38px] font-normal tracking-[-0.04em] mt-1.5 font-mono tabular-nums leading-tight">
        {value}
      </b>
      {trend && (
        <em className={cn('font-mono text-[12px] not-italic mt-1', trendColorClass)}>
          {trend}
        </em>
      )}
    </div>
  );
};
