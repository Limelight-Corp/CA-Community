'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@ascend/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setOfflineNotice('Connection restored. Back online.');
      setTimeout(() => setOfflineNotice(null), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineNotice('Offline mode active. Your digital passes and cached materials are available.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      const dismissedAt = localStorage.getItem('ascend_pwa_dismissed');
      const now = Date.now();
      // Show if not dismissed or dismissed > 7 days ago
      if (!dismissedAt || now - parseInt(dismissedAt, 10) > 7 * 24 * 60 * 60 * 1000) {
        // Delay display slightly for engagement criteria
        setTimeout(() => {
          setShowBanner(true);
        }, 2500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ascend_pwa_dismissed', Date.now().toString());
    }
  };

  return (
    <>
      {/* Offline Status Pill Notification */}
      {offlineNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-mono shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 bg-[rgba(7,13,40,0.95)] backdrop-blur-md border border-[#283570] text-white"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-[#FF5555] animate-pulse' : 'bg-[var(--teal)]'
            }`}
          />
          <span>{offlineNotice}</span>
          {isOffline && (
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="ml-1 text-[var(--lime)] underline hover:text-white cursor-pointer bg-transparent border-0 text-[12px] p-0"
            >
              Passes →
            </button>
          )}
        </div>
      )}

      {/* Prototype-Fidelity PWA Install Banner */}
      {showBanner && deferredPrompt && (
        <aside
          aria-label="Install ASCEND CA App"
          className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-[420px] z-40 p-4 md:p-5 rounded-[16px] bg-[rgba(7,13,40,0.92)] backdrop-blur-[16px] border border-[#283570] shadow-[0_12px_36px_rgba(0,0,0,0.7)] text-white flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-[linear-gradient(135deg,#0C1A58,#173196)] border border-[#283570] flex items-center justify-center p-1.5 shadow-md shrink-0">
                <svg viewBox="0 0 24 24" className="w-full h-full text-[var(--lime)] fill-current">
                  <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-white leading-tight">
                  Install ASCEND CA
                </h3>
                <p className="text-[12px] text-[var(--muted)] leading-tight mt-0.5">
                  Offline venue check-in & quick QR passes
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Close install prompt"
              className="text-[var(--faint)] hover:text-white bg-transparent border-0 p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-[rgba(30,39,86,0.6)]">
            <button
              onClick={handleDismiss}
              className="text-[12px] font-mono text-[var(--muted)] hover:text-white bg-transparent border-0 px-2 py-1.5 cursor-pointer"
            >
              Not Now
            </button>
            <Button
              variant="lime"
              size="sm"
              onClick={handleInstallClick}
              className="px-4 py-1.5 text-[13px] font-medium"
            >
              Install App
            </Button>
          </div>
        </aside>
      )}
    </>
  );
};
