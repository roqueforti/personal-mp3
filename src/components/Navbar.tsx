'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Search,
  Upload,
  Sliders,
  Moon,
  Music2,
  FolderHeart,
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
    <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Top Row: Brand & Primary Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveFilter('all')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                Sonic<span className="text-primary-400">Vault</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Personal MP3 Player</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Storage / Offline Status Badge */}
            <div
              title={
                storageInfo.isPersisted
                  ? 'Penyimpanan lokal persisten aktif. File audio & cache aplikasi tersimpan permanen di perangkat tanpa download ulang.'
                  : 'File audio & aplikasi tersimpan di penyimpanan lokal browser.'
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-slate-300 select-none"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-medium">{formatFileSize(storageInfo.usedBytes)}</span>
              <span className="hidden sm:inline text-emerald-400 font-semibold">• Offline Ready</span>
            </div>

            {/* Equalizer Modal Trigger */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              title="Equalizer"
              className="p-2.5 rounded-xl bg-surface-raised hover:bg-surface-active border border-border text-slate-300 hover:text-white transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Sleep Timer Modal Trigger */}
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              title="Sleep Timer"
              className={`relative p-2.5 rounded-xl border transition-colors ${
                sleepTimer.active
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-surface-raised hover:bg-surface-active border-border text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              {sleepTimer.active && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 animate-pulse border-2 border-surface" />
              )}
            </button>

            {/* Playlists Modal Trigger */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              title="Playlists"
              className="p-2.5 rounded-xl bg-surface-raised hover:bg-surface-active border border-border text-slate-300 hover:text-white transition-colors"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-600 active:scale-95 text-white font-medium text-sm transition-all shadow-md shadow-primary/25"
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
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-surface-raised border border-border text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised hover:bg-surface-active border border-border text-slate-300'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            Semua ({songs.length})
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'favorites'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-surface-raised hover:bg-surface-active border border-border text-slate-300'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 text-rose-400" />
            Favorit ({favoriteCount})
          </button>

          <button
            onClick={() => setActiveFilter('recent')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === 'recent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-surface-raised hover:bg-surface-active border border-border text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Terbaru Diputar
          </button>

          {/* Custom Playlists Chips */}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => setActiveFilter(pl.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeFilter === pl.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surface-raised hover:bg-surface-active border border-border text-slate-300'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
              {pl.name} ({pl.songIds.length})
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
