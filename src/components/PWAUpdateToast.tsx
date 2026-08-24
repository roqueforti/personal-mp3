'use client';

import { useEffect } from 'react';

// Silent Auto-Updater: Automatically activates new PWA deployments in the background
// without showing intrusive toasts or requiring manual "Perbarui" button clicks.
export default function PWAUpdateToast() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      // 1. Force update check on window focus and online
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('online', checkForUpdate);

      // 2. If a new worker is waiting, automatically skip waiting
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 3. When new worker is installing, activate it as soon as installed
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      return () => {
        window.removeEventListener('focus', checkForUpdate);
        window.removeEventListener('online', checkForUpdate);
      };
    });
  }, []);

  return null;
}
