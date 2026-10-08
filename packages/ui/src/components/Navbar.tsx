'use client';

import React from 'react';
import { AscendLogoMark, SearchIcon, MenuIcon } from './icons';
import { Button } from './Button';
import { cn } from '../utils';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
}

export interface NavbarProps {
  navItems?: NavItem[];
  currentNav?: string;
  onNavigate?: (id: string) => void;
  onSearchClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onBurgerClick?: () => void;
  user?: { name: string; initials: string } | null;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems = [
    { id: 'about', label: 'About' },
    { id: 'events', label: 'Events' },
    { id: 'wings', label: 'Wings' },
    { id: 'speakers', label: 'Speakers' },
    { id: 'resources', label: 'Resources' },
    { id: 'news', label: 'News' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' },
  ],
  currentNav,
  onNavigate,
  onSearchClick,
  onLoginClick,
  onRegisterClick,
  onBurgerClick,
  user,
  className,
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-[rgba(3,5,15,0.72)] backdrop-blur-[18px] saturate-[140%] border-b border-[var(--line)] text-[var(--on-ink)]',
        className
      )}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-[68px] flex items-center gap-7">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2.5 bg-transparent border-0 p-0 text-inherit cursor-pointer select-none group"
          aria-label="ASCEND home"
        >
          <span className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#4A72FF] to-[#1F45D6] grid place-items-center text-white shadow-sm transition-transform group-hover:scale-105">
            <AscendLogoMark size={18} />
          </span>
          <b className="font-display font-semibold text-[15px] tracking-[0.16em] text-white">
            ASCEND
          </b>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'bg-transparent border-0 py-2 px-3 cursor-pointer text-[14px] font-medium rounded-full transition-colors select-none',
                  isActive
                    ? 'text-white font-medium bg-[rgba(219,231,240,0.06)]'
                    : 'text-[var(--on-ink-muted)] hover:text-white hover:bg-[rgba(219,231,240,0.06)]'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="ml-auto flex items-center gap-2.5">
          <button
            onClick={onSearchClick}
            className="p-2 text-[var(--on-ink-muted)] hover:text-white rounded-full transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Search events and resources"
          >
            <SearchIcon size={20} />
          </button>

          {user ? (
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-[rgba(219,231,240,0.06)] border border-[var(--line)] text-[var(--fg)] hover:border-[rgba(219,231,240,0.2)] transition-colors cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--lime)] text-white text-[11px] font-semibold grid place-items-center">
                {user.initials}
              </span>
              <span className="text-[13.5px] font-medium hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginClick}
              className="hidden sm:inline-flex"
            >
              Log in
            </Button>
          )}

          <Button
            variant="lime"
            size="sm"
            onClick={onRegisterClick}
            className="hidden sm:inline-flex"
          >
            Register for an event
          </Button>

          <button
            onClick={onBurgerClick}
            className="lg:hidden p-2 rounded-md border border-[#2A3366] text-white bg-transparent cursor-pointer flex items-center justify-center"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
