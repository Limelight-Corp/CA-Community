import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatInr(amount: number): string {
  if (amount === 0) return 'Free';
  return '₹' + amount.toLocaleString('en-IN');
}

export function getInitials(name: string): string {
  return name
    .replace(/^CA\s+|^Adv\.\s+/i, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
