'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import NativeConfirmModal from './NativeConfirmModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsStandalone(true);
      return;
    }

    if (typeof window !== 'undefined') {
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
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
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
    <>
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-3.5 shadow-xs animate-fade-in flex items-center justify-between gap-3 mb-1 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 text-white shadow-2xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <span>Install SonicVault di HP</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                PWA
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Bisa putar di Lock Screen & Offline tanpa internet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold transition-transform shadow-xs"
          >
            {isIOS ? 'Petunjuk' : 'Install'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-900 active:scale-90 rounded-full transition-transform"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      <NativeConfirmModal
        isOpen={showIOSInstructions}
        title="Install di iPhone / iPad"
        message="1. Ketuk tombol Bagikan (Share) di Safari bawah.&#10;2. Pilih Tambah ke Layar Utama (Add to Home Screen)."
        confirmText="Mengerti"
        cancelText="Tutup"
        type="info"
        onConfirm={() => setShowIOSInstructions(false)}
        onCancel={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
