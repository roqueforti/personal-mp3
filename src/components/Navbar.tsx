'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Search,
  Sliders,
  Moon,
  Cloud,
  Database,
  X,
  Headphones,
  Sun,
} from 'lucide-react';

export default function Navbar() {
  const {
    searchQuery,
    setSearchQuery,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsCloudModalOpen,
    setIsBackgroundModalOpen,
    isWakeLockActive,
    isCloudConnected,
    isSyncing,
    sleepTimer,
  } = useAudio();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 pt-[env(safe-area-inset-top,0px)] select-none">
      <div className="max-w-md mx-auto px-4 py-2.5">
        {/* Top Native Header Row */}
        <div className="flex items-center justify-between gap-3 h-10">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <circle cx="8" cy="17" r="3" />
                <circle cx="16" cy="14" r="3" />
                <rect x="10" y="5" width="2" height="12" />
                <rect x="18" y="2" width="2" height="12" />
                <path d="M10 7 L19 4 L19 7 L10 10 Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900">
                SonicVault
              </h1>
              <p className="text-[9px] font-bold text-slate-400 -mt-0.5 tracking-wider uppercase">
                Offline Music
              </p>
            </div>
          </div>

          {/* Right Actions: Quick Search, Screen-Off BG Settings, Sleep Timer, Cloud Sync & EQ */}
          <div className="flex items-center gap-1 -mr-1.5">
            {/* Quick In-List Search Toggle */}
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsSearchOpen(!isSearchOpen);
              }}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isSearchOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Cari Lagu Cepat"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Background & Screen-Off Playback Settings */}
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsBackgroundModalOpen(true);
              }}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-transform"
              title="Pengaturan Putar Saat Layar Mati"
            >
              <Headphones className="w-4 h-4" />
              {isWakeLockActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 border border-white" />
              )}
            </button>

            {/* Sleep Timer Indicator Pill */}
            {sleepTimer.active && (
              <button
                onClick={() => {
                  triggerHaptic(5);
                  setIsSleepTimerOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-200 text-xs font-bold active:scale-90 transition-transform"
                title="Sleep Timer Aktif"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{sleepTimer.minutesRemaining}m</span>
              </button>
            )}

            {/* Cloud Sync Status */}
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsCloudModalOpen(true);
              }}
              title={isCloudConnected ? 'Cloud Sync Terhubung' : 'Hubungkan Cloud'}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-transform"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-indigo-600' : ''}`} />
              {isCloudConnected && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              )}
            </button>

            {/* Equalizer */}
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsEqualizerOpen(true);
              }}
              title="5-Band Equalizer"
              className="p-2 rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-transform"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Quick Search Input Bar */}
        {isSearchOpen && (
          <div className="pt-2 pb-1 animate-fade-in">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Cari lagu, artis, atau album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 transition-all focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
