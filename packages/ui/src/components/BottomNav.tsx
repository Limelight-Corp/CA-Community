'use client';

import React from 'react';
import { HomeIcon, CalendarIcon, PlusIcon, GridIcon, UserIcon } from './icons';
import { cn } from '../utils';

export interface BottomNavProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, className }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'events', label: 'Events', icon: CalendarIcon },
    { id: 'reg', label: '', icon: PlusIcon, isCta: true },
    { id: 'wings', label: 'Wings', icon: GridIcon },
    { id: 'dashboard', label: 'Account', icon: UserIcon },
  ];

  return (
    <nav
      aria-label="App bottom navigation"
      className={cn(
        'fixed left-0 right-0 bottom-0 z-35 flex md:hidden items-center justify-around',
        'bg-[rgb(var(--ink-rgb)/0.86)] backdrop-blur-[14px] border-t border-[var(--line)]',
        'py-2 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]',
        className
      )}
    >
      {tabs.map((t) => {
        if (t.isCta) {
          return (
            <button
              key={t.id}
              onClick={() => onTabChange('events')}
              className="w-[46px] h-[40px] rounded-[12px] bg-gradient-to-b from-brand-400 to-brand-700 text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgb(var(--lime-rgb)/0.9)] cursor-pointer border-0"
              aria-label="Register for an event"
            >
              <PlusIcon size={20} />
            </button>
          );
        }

        const isActive = currentTab === t.id;
        const IconComponent = t.icon;

        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-[3px] py-1 px-2.5 min-w-[56px] bg-transparent border-0 cursor-pointer select-none',
              'text-[10.5px] font-sans font-medium transition-colors',
              isActive ? 'text-[var(--fg)]' : 'text-[var(--faint)] hover:text-[var(--muted)]'
            )}
          >
            <IconComponent size={22} className={isActive ? 'text-[var(--fg)]' : 'text-current'} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
