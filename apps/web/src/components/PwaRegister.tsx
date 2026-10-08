'use client';

import React, { useEffect } from 'react';
import { PwaBanner } from './PwaBanner';

export const PwaRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[ASCEND PWA] Service Worker registered with scope:', registration.scope);

            // Handle updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[ASCEND PWA] New content available; please refresh.');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn('[ASCEND PWA] Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return <PwaBanner />;
};
