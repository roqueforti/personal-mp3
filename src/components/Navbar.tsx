'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Search,
  Upload,
  Sliders,
  Moon,
  Music2,
  Heart,
  HardDrive,
  Cloud,
  X,
} from 'lucide-react';
import { formatFileSize } from '@/lib/formatters';

export default function Navbar() {
  const {
    songs,
    searchQuery,
    setSearchQuery,
    setIsUploadOpen,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsCloudModalOpen,
    isCloudConnected,
    isSyncing,
    sleepTimer,
    storageInfo,
  } = useAudio();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Top Native Header Row */}
        <div className="flex items-center justify-between gap-3 h-10">
          {/* Left Action: Search Icon */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Center Title: MY MUSIC */}
          <h1 className="text-base font-black tracking-wider text-slate-900 uppercase">
            My Music
          </h1>

          {/* Right Actions: Cloud & EQ */}
          <div className="flex items-center gap-1 -mr-2">
            {/* Sleep Timer */}
            {sleepTimer.active && (
              <button
                onClick={() => setIsSleepTimerOpen(true)}
                className="p-2 rounded-full text-amber-600 bg-amber-50"
              >
                <Moon className="w-4 h-4" />
              </button>
            )}

            {/* Cloud Sync Icon */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              title={isCloudConnected ? 'Cloud Sync Terhubung' : 'Hubungkan Cloud'}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Cloud className={`w-5 h-5 ${isSyncing ? 'animate-bounce text-indigo-600' : ''}`} />
              {isCloudConnected && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              )}
            </button>

            {/* Equalizer */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              title="Equalizer"
              className="p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
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
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700"
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
