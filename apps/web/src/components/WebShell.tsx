'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Navbar, BottomNav, Drawer, ToastProvider, Button } from '@ascend/ui';
import { PwaRegister } from './PwaRegister';

export interface WebShellProps {
  children: React.ReactNode;
}

export const WebShell: React.FC<WebShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { id: 'about', label: 'About', href: '/about' },
    { id: 'events', label: 'Events', href: '/events' },
    { id: 'wings', label: 'Wings', href: '/wings' },
    { id: 'speakers', label: 'Speakers', href: '/speakers' },
    { id: 'resources', label: 'Resources', href: '/resources' },
    { id: 'news', label: 'News', href: '/news' },
    { id: 'gallery', label: 'Gallery', href: '/gallery' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ];

  // Exact 9 items and sequence from prototype footer
  const footerLinks = [
    { id: 'about', label: 'About', href: '/about' },
    { id: 'events', label: 'Events', href: '/events' },
    { id: 'wings', label: 'Wings', href: '/wings' },
    { id: 'membership', label: 'Membership', href: '/membership' },
    { id: 'speakers', label: 'Speakers', href: '/speakers' },
    { id: 'resources', label: 'Resources', href: '/resources' },
    { id: 'news', label: 'News', href: '/news' },
    { id: 'gallery', label: 'Gallery', href: '/gallery' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ];

  const currentNav = navItems.find((n) => pathname.startsWith(n.href))?.id || (pathname === '/' ? 'home' : '');

  const handleNavigate = (id: string) => {
    setIsDrawerOpen(false);
    if (id === 'home') router.push('/');
    else if (id === 'dashboard') router.push('/dashboard');
    else if (id === 'login') router.push('/login');
    else if (id === 'join' || id === 'membership') router.push('/membership');
    else router.push(`/${id}`);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] pb-16 md:pb-0">
        {/* Top Navbar */}
        <Navbar
          navItems={navItems}
          currentNav={currentNav}
          onNavigate={handleNavigate}
          onSearchClick={() => router.push('/search')}
          onLoginClick={() => router.push('/login')}
          onRegisterClick={() => router.push('/events')}
          onBurgerClick={() => setIsDrawerOpen(true)}
        />

        {/* Main Page Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer (Exact Prototype Design) */}
        <footer>
          <div className="wrap">
            <div className="f-top">
              <h2>
                Learn. Connect.<br />Grow. <em className="s">Contribute.</em>
              </h2>
              <div className="f-links">
                {footerLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="f-bot">
              <span>© 2026 ASCEND · hello@ascend-ca.in</span>
              <span style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => router.push('/legal?tab=0')}>Privacy</button>
                <button type="button" onClick={() => router.push('/legal?tab=1')}>Terms</button>
                <button type="button" onClick={() => router.push('/legal?tab=2')}>Event</button>
                <button type="button" onClick={() => router.push('/legal?tab=3')}>Cancellation</button>
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
              </span>
            </div>
          </div>
        </footer>

        {/* Mobile Navigation Drawer */}
        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <div className="flex flex-col gap-1 mt-4">
            <button
              onClick={() => handleNavigate('home')}
              className="bg-transparent border-0 border-b border-[#1E2756] py-3 text-left text-[20px] font-light text-white cursor-pointer"
            >
              Home
            </button>
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNavigate(n.id)}
                className="bg-transparent border-0 border-b border-[#1E2756] py-3 text-left text-[20px] font-light text-white cursor-pointer"
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={() => handleNavigate('membership')}
              className="bg-transparent border-0 border-b border-[#1E2756] py-3 text-left text-[20px] font-light text-white cursor-pointer"
            >
              Membership
            </button>
            <button
              onClick={() => handleNavigate('login')}
              className="bg-transparent border-0 py-3 text-left text-[20px] font-light text-[var(--lime-deep)] cursor-pointer"
            >
              Member Log In
            </button>
            <Button
              variant="lime"
              onClick={() => handleNavigate('events')}
              className="mt-6 w-full"
            >
              Register for an event
            </Button>
          </div>
        </Drawer>

        {/* Mobile PWA Bottom Tab Bar */}
        <BottomNav
          currentTab={currentNav}
          onTabChange={(tabId) => handleNavigate(tabId)}
        />

        {/* PWA Service Worker & Install Banner */}
        <PwaRegister />
      </div>
    </ToastProvider>
  );
};
