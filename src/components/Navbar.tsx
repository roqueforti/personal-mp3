'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Search,
  Upload,
  Sliders,
  Moon,
  Music2,
  Heart,
  Clock,
  HardDrive,
  ListMusic,
  X,
} from 'lucide-react';
import { formatFileSize } from '@/lib/formatters';

export default function Navbar() {
  const {
    songs,
    playlists,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    setIsUploadOpen,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsPlaylistModalOpen,
    sleepTimer,
    storageInfo,
  } = useAudio();

  const favoriteCount = songs.filter((s) => s.favorite).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top Row: Brand & Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveFilter('all')}>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                SonicVault
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">MP3 Player</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Storage Info Badge */}
            <div
              title={
                storageInfo.isPersisted
                  ? 'Penyimpanan lokal persisten aktif di perangkat'
                  : 'Penyimpanan lokal browser'
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold select-none"
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-700" />
              <span>{formatFileSize(storageInfo.usedBytes)}</span>
              <span className="hidden sm:inline text-emerald-600 font-bold">• Offline</span>
            </div>

            {/* Equalizer */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              title="Equalizer"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Sleep Timer */}
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              title="Sleep Timer"
              className={`relative p-2.5 rounded-xl border transition-colors ${
                sleepTimer.active
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              {sleepTimer.active && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
              )}
            </button>

            {/* Playlists */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              title="Playlists"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload MP3</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari lagu, artis, atau album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
            }`}
          >
            Semua ({songs.length})
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'favorites'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeFilter === 'favorites' ? 'fill-white text-white' : 'text-slate-700'}`} />
            Favorit ({favoriteCount})
          </button>

          <button
            onClick={() => setActiveFilter('recent')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'recent'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Baru Diputar
          </button>

          {/* Custom Playlists */}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => setActiveFilter(pl.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeFilter === pl.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              {pl.name} ({pl.songIds.length})
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
