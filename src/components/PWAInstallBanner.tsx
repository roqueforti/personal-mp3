'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert(
          'Cara Install di iPhone/iPad:\n1. Ketuk tombol Bagikan (Share) di Safari bawah.\n2. Pilih "Tambah ke Layar Utama" (Add to Home Screen).'
        );
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isDismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 max-w-lg mx-auto z-40 bg-surface-raised border border-primary/40 rounded-2xl p-3.5 shadow-2xl animate-fade-in flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-primary/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
            <span>Install SonicVault di HP</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white">PWA</span>
          </h4>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            Bisa putar di Lock Screen & Offline tanpa internet
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold transition-all shadow-sm"
        >
          {isIOS ? 'Petunjuk' : 'Install'}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
