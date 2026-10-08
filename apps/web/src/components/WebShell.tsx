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

  const currentNav = navItems.find((n) => pathname.startsWith(n.href))?.id || (pathname === '/' ? 'home' : '');

  const handleNavigate = (id: string) => {
    setIsDrawerOpen(false);
    if (id === 'home') router.push('/');
    else if (id === 'dashboard') router.push('/dashboard');
    else if (id === 'login') router.push('/login');
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

        {/* Global Footer matching prototype */}
        <footer className="mt-sec border-t border-[var(--line)] bg-[radial-gradient(70%_120%_at_50%_0%,rgba(15,56,192,0.28),transparent_70%),var(--ink)] text-[var(--on-ink-muted)]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-18 pb-8">
            <div className="flex justify-between items-start gap-10 flex-wrap">
              <h2 className="font-display text-[clamp(28px,3.2cqi,40px)] font-medium text-white tracking-[-0.035em] max-w-[16ch]">
                Learn. Connect. Grow. <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">Contribute.</em>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-2.5 text-[14px]">
                {navItems.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNavigate(n.id)}
                    className="bg-transparent border-0 p-0 text-inherit hover:text-white cursor-pointer text-left transition-colors"
                  >
                    {n.label}
                  </button>
                ))}
                <button
                  onClick={() => router.push('/membership')}
                  className="bg-transparent border-0 p-0 text-inherit hover:text-white cursor-pointer text-left transition-colors"
                >
                  Membership
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4 flex-wrap border-t border-[#1E2756] mt-16 pt-6 font-mono text-[12px]">
              <span>© 2026 ASCEND · hello@ascend-ca.in</span>
              <div className="flex gap-5 flex-wrap">
                <button
                  onClick={() => router.push('/legal')}
                  className="bg-transparent border-0 p-0 text-inherit hover:text-white cursor-pointer"
                >
                  Privacy
                </button>
                <button
                  onClick={() => router.push('/legal')}
                  className="bg-transparent border-0 p-0 text-inherit hover:text-white cursor-pointer"
                >
                  Terms
                </button>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit hover:text-white"
                >
                  LinkedIn
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit hover:text-white"
                >
                  Instagram
                </a>
              </div>
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
