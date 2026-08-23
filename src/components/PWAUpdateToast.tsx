'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export default function PWAUpdateToast() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      // Check for updates on focus and online
      const checkUpdate = () => {
        registration.update().catch(() => {});
      };

      window.addEventListener('focus', checkUpdate);
      window.addEventListener('online', checkUpdate);

      // Interval check every 15 minutes
      const interval = setInterval(checkUpdate, 15 * 60 * 1000);

      // Listen for new worker waiting
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });

      return () => {
        window.removeEventListener('focus', checkUpdate);
        window.removeEventListener('online', checkUpdate);
        clearInterval(interval);
      };
    });

    // Listen to messages from Service Worker (e.g. DEPLOYMENT_UPDATED)
    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DEPLOYMENT_UPDATED') {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);

    // Auto reload when new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 bg-slate-900 text-white border border-slate-700 rounded-2xl p-3 shadow-2xl animate-fade-in flex items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight">Pembaruan Versi Baru!</p>
          <p className="text-[11px] text-slate-300 truncate">Versi terbaru sudah siap dipasang</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleApplyUpdate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          Perbarui
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
