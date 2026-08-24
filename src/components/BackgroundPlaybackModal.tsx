'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Smartphone,
  CheckCircle2,
  ShieldAlert,
  Moon,
  Sun,
  Lock,
  BatteryCharging,
  Zap,
  HelpCircle,
  X,
  Sparkles,
  Download,
  Info,
  ChevronRight,
  Headphones,
  Music,
  Youtube,
  Radio,
} from 'lucide-react';

type PhoneBrand = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'iphone';

export default function BackgroundPlaybackModal() {
  const {
    isBackgroundModalOpen,
    setIsBackgroundModalOpen,
    isWakeLockActive,
    toggleWakeLock,
    currentSong,
    isPlaying,
  } = useAudio();

  const [activeBrand, setActiveBrand] = useState<PhoneBrand>('xiaomi');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isWakeLockSupported, setIsWakeLockSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsWakeLockSupported('wakeLock' in navigator);
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(standalone));

      // Auto detect device brand if possible
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActiveBrand('iphone');
      } else if (/samsung/.test(ua)) {
        setActiveBrand('samsung');
      } else if (/xiaomi|redmi|poco/.test(ua)) {
        setActiveBrand('xiaomi');
      } else if (/oppo|realme|oneplus/.test(ua)) {
        setActiveBrand('oppo');
      } else if (/vivo|iqoo/.test(ua)) {
        setActiveBrand('vivo');
      }
    }
  }, []);

  if (!isBackgroundModalOpen) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const isCurrentSongYouTube = Boolean(currentSong?.youtubeVideoId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
              <Headphones className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Putar Saat Layar Mati</h3>
              <p className="text-xs text-slate-300 font-medium">
                Pengaturan Background & Lock Screen HP
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic(5);
              setIsBackgroundModalOpen(false);
            }}
            className="p-2 rounded-full hover:bg-white/10 active:scale-90 text-slate-300 hover:text-white transition-all"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Status Alert Banner */}
          {isCurrentSongYouTube ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-amber-900">
                <span className="font-bold block text-amber-950 mb-0.5">
                  Lagu YouTube Sedang Diputar:
                </span>
                Browser HP otomatis menjeda video YouTube saat layar dimatikan (kebijakan browser mobile).
                Untuk putar tanpa henti saat layar mati, putar <strong>Lagu MP3 Lokal</strong> atau{' '}
                <strong>Cloud Vault</strong>!
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-xs leading-relaxed text-emerald-900">
                <span className="font-bold text-emerald-950 block">
                  Audio Engine Layar Mati Siap:
                </span>
                Lagu MP3 & Cloud Vault aktif dan dapat terus berputar meskipun layar HP dikunci/mati.
              </div>
            </div>
          )}

          {/* Quick Feature Toggles */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Opsi Pemutaran Layar
            </h4>

            {/* Screen Wake Lock Toggle */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Cegah Layar Tidur (Screen Wake Lock)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Layar HP tetap menyala saat lagu berputar (cocok untuk mobil & meja).
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  toggleWakeLock();
                }}
                disabled={!isWakeLockSupported}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex-shrink-0 flex items-center p-0.5 ${
                  isWakeLockActive ? 'bg-slate-900' : 'bg-slate-300'
                } ${!isWakeLockSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform transform ${
                    isWakeLockActive ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Lock Screen Media Controls Status */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Kontrol Media di Layar Kunci
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tombol Play, Pause, Next, Prev, dan Artwork aktif di notifikasi HP.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Aktif
              </span>
            </div>

            {/* PWA Mode Status */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-900">Status Aplikasi Terpasang</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isStandalone
                    ? 'Aplikasi terpasang sebagai PWA dengan prioritas latar belakang tinggi.'
                    : 'Disarankan install PWA ke layar utama agar Android tidak mematikan browser.'}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isStandalone
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isStandalone ? 'PWA Terpasang' : 'Browser Web'}
              </span>
            </div>
          </div>

          {/* Android / iOS Battery Optimization Steps */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Tips Agar Lagu Tidak Dimatikan HP</span>
              </h4>
            </div>

            <p className="text-xs text-slate-600">
              Sistem operasi Android (seperti Xiaomi, Samsung, Oppo, Vivo) sering mematikan tab browser
              saat layar mati untuk hemat baterai. Ikuti langkah mudah berikut:
            </p>

            {/* Brand Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  { id: 'xiaomi', label: 'Xiaomi / POCO' },
                  { id: 'samsung', label: 'Samsung' },
                  { id: 'oppo', label: 'Oppo / Realme' },
                  { id: 'vivo', label: 'Vivo / iQOO' },
                  { id: 'iphone', label: 'iPhone (iOS)' },
                ] as const
              ).map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => {
                    triggerHaptic(5);
                    setActiveBrand(brand.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeBrand === brand.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {brand.label}
                </button>
              ))}
            </div>

            {/* Step-by-Step Instructions Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              {activeBrand === 'xiaomi' && (
                <>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Setel Penghemat Baterai ke Tidak Ada Pembatasan</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka <strong>Pengaturan</strong> &gt; <strong>Aplikasi</strong> &gt;{' '}
                    <strong>Kelola Aplikasi</strong> &gt; pilih <strong>SonicVault / Chrome</strong>{' '}
                    &gt; <strong>Penghemat Baterai</strong> &gt; pilih{' '}
                    <strong className="text-slate-900">Tidak Ada Pembatasan (No Restrictions)</strong>.
                  </p>

                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Gembok SonicVault di Recent Apps</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka Recent Apps (layar multitasking), tekan & tahan SonicVault, lalu ketuk ikon{' '}
                    <strong>Gembok (Lock)</strong> agar memori tidak dibersihkan saat layar mati.
                  </p>
                </>
              )}

              {activeBrand === 'samsung' && (
                <>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Ubah Penggunaan Baterai ke "Tidak Dibatasi"</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka <strong>Pengaturan</strong> &gt; <strong>Aplikasi</strong> &gt; pilih{' '}
                    <strong>SonicVault / Chrome</strong> &gt; <strong>Baterai</strong> &gt; pilih{' '}
                    <strong className="text-slate-900">Tidak Dibatasi (Unrestricted)</strong>.
                  </p>

                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Hapus dari Aplikasi yang Ditidurkan</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Pastikan SonicVault tidak masuk ke daftar <em>Sleeping Apps</em> atau{' '}
                    <em>Deep Sleeping Apps</em> di menu Perawatan Perangkat.
                  </p>
                </>
              )}

              {activeBrand === 'oppo' && (
                <>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Izinkan Aktivitas Latar Belakang</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka <strong>Pengaturan</strong> &gt; <strong>Manajemen Aplikasi</strong> &gt;{' '}
                    <strong>SonicVault / Chrome</strong> &gt; <strong>Penggunaan Baterai</strong> &gt;{' '}
                    Aktifkan <strong className="text-slate-900">Izinkan Aktivitas Latar Belakang</strong>.
                  </p>

                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Kunci di Menu Recent Tasks</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka tombol navigasi recent apps, ketuk ikon titik tiga di atas SonicVault, lalu pilih{' '}
                    <strong>Kunci (Lock)</strong>.
                  </p>
                </>
              )}

              {activeBrand === 'vivo' && (
                <>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Izinkan Konsumsi Daya Tinggi di Latar Belakang</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka <strong>Pengaturan</strong> &gt; <strong>Baterai</strong> &gt;{' '}
                    <strong>Konsumsi Daya Latar Belakang Tinggi</strong> &gt; Cari{' '}
                    <strong>SonicVault / Chrome</strong> dan aktifkan tombol izin.
                  </p>
                </>
              )}

              {activeBrand === 'iphone' && (
                <>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Tambahkan ke Layar Utama (Add to Home Screen)</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka SonicVault di Safari, ketuk tombol <strong>Bagikan (Share)</strong> di bagian
                    bawah, lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </p>

                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Aktifkan Segarkan App di Latar Belakang</span>
                  </div>
                  <p className="text-slate-600 pl-6 text-[11px]">
                    Buka <strong>Pengaturan iPhone</strong> &gt; <strong>Umum</strong> &gt;{' '}
                    <strong>Segarkan App di Latar Belakang</strong> &gt; Pastikan aktif.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-medium">
            SonicVault Audio Keep-Alive Engine v2.4
          </p>
          <button
            onClick={() => {
              triggerHaptic(10);
              setIsBackgroundModalOpen(false);
            }}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
