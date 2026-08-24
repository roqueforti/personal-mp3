'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Search,
  X,
  Upload,
  Sliders,
  Cloud,
  Moon,
  Headphones,
  Sparkles,
  Database,
} from 'lucide-react';

export default function DesktopHeader() {
  const {
    searchQuery,
    setSearchQuery,
    isCloudConnected,
    isSyncing,
    isWakeLockActive,
    sleepTimer,
    setIsCloudModalOpen,
    setIsEqualizerOpen,
    setIsStudioOpen,
    setIsBackgroundModalOpen,
    setIsSleepTimerOpen,
    setIsYouTubeSearchOpen,
  } = useAudio();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3.5 hidden md:flex items-center justify-between gap-4 select-none">
      {/* Left: Desktop Search Bar */}
      <div className="flex-1 max-w-md relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        <input
          type="text"
          placeholder="Cari lagu, artis, atau album di vault Anda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-100/90 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 transition-all focus:outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-700 active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Desktop Action Pills */}
      <div className="flex items-center gap-2.5">
        {/* Search Online & YouTube Button */}
        <button
          onClick={() => setIsYouTubeSearchOpen(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cari Lagu Online</span>
        </button>

        {/* Upload Music to Vault */}
        <button
          onClick={() => setIsStudioOpen(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black active:scale-95 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Lagu</span>
        </button>

        {/* Sleep Timer Indicator */}
        {sleepTimer.active && (
          <button
            onClick={() => setIsSleepTimerOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-amber-800 bg-amber-50 border border-amber-200 text-xs font-bold active:scale-95 transition-transform"
            title="Sleep Timer Aktif"
          >
            <Moon className="w-3.5 h-3.5 text-amber-600" />
            <span>{sleepTimer.minutesRemaining}m</span>
          </button>
        )}

        {/* Cloud Sync Button */}
        <button
          onClick={() => setIsCloudModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            isCloudConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title={isCloudConnected ? 'Cloud Sync Aktif' : 'Hubungkan Supabase Cloud'}
        >
          <Cloud
            className={`w-3.5 h-3.5 ${
              isSyncing
                ? 'animate-bounce text-indigo-600'
                : isCloudConnected
                ? 'text-emerald-600'
                : 'text-slate-500'
            }`}
          />
          <span>{isCloudConnected ? 'Cloud Synced' : 'Connect Cloud'}</span>
        </button>

        {/* 5-Band Equalizer Button */}
        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-90 transition-all border border-slate-200"
          title="5-Band Equalizer"
        >
          <Sliders className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </header>
  );
}
