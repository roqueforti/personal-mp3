'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Home,
  Search,
  Library,
  Upload,
  Heart,
  Music,
  Sliders,
  Moon,
  Headphones,
  Cloud,
  ListMusic,
  Plus,
  Radio,
  CheckCircle2,
  Database,
  Sparkles,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentTab: 'home' | 'search' | 'library' | 'studio';
  setCurrentTab: (tab: 'home' | 'search' | 'library' | 'studio') => void;
}

export default function DesktopSidebar({ currentTab, setCurrentTab }: DesktopSidebarProps) {
  const {
    songs,
    playlists,
    isCloudConnected,
    isSyncing,
    isWakeLockActive,
    sleepTimer,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsBackgroundModalOpen,
    setIsCloudModalOpen,
    setIsStudioOpen,
    setIsPlaylistModalOpen,
    setIsYouTubeSearchOpen,
    setActiveFilter,
    playSong,
  } = useAudio();

  const favoriteSongsCount = songs.filter((s) => s.favorite).length;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-40 border-r border-slate-800/80 select-none hidden md:flex">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <circle cx="8" cy="17" r="3" />
              <circle cx="16" cy="14" r="3" />
              <rect x="10" y="5" width="2" height="12" />
              <rect x="18" y="2" width="2" height="12" />
              <path d="M10 7 L19 4 L19 7 L10 10 Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              SonicVault
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Web Audio Player
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation Links (Spotify Style) */}
      <div className="px-3 py-4 space-y-1">
        <button
          onClick={() => {
            setCurrentTab('home');
            setActiveFilter('all');
          }}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'home'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className={`w-4 h-4 ${currentTab === 'home' ? 'text-emerald-400' : ''}`} />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('search');
            setIsYouTubeSearchOpen(true);
          }}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'search'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className={`w-4 h-4 ${currentTab === 'search' ? 'text-indigo-400' : ''}`} />
          <span>Search & YouTube</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('library');
            setIsPlaylistModalOpen(true);
          }}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'library'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className={`w-4 h-4 ${currentTab === 'library' ? 'text-amber-400' : ''}`} />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('studio');
            setIsStudioOpen(true);
          }}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'studio'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload className={`w-4 h-4 ${currentTab === 'studio' ? 'text-rose-400' : ''}`} />
          <span>Upload & Studio</span>
        </button>
      </div>

      {/* Middle Section: Quick Playlists & Favorites (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 border-t border-slate-800/60">
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Playlists
            </span>
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5"
              title="Buat Playlist Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Liked Songs Quick Tile */}
          <div
            onClick={() => {
              setActiveFilter('favorites');
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 group transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                Lagu Favorit
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {favoriteSongsCount} lagu disukai
              </p>
            </div>
          </div>

          {/* Custom Playlists list */}
          <div className="space-y-0.5 mt-1">
            {playlists.map((pl) => {
              const plSongs = songs.filter((s) => pl.songIds.includes(s.id));
              return (
                <div
                  key={pl.id}
                  onClick={() => {
                    if (plSongs.length > 0) {
                      playSong(plSongs[0], plSongs);
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer truncate transition-colors"
                >
                  <ListMusic className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{pl.name}</span>
                  <span className="text-[10px] text-slate-600 ml-auto flex-shrink-0">
                    {pl.songIds.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Desktop Sidebar Shortcuts & Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1.5">
        {/* Equalizer Shortcut */}
        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>5-Band Equalizer</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">HD</span>
        </button>

        {/* Background & Layar Mati */}
        <button
          onClick={() => setIsBackgroundModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Headphones className="w-4 h-4 text-indigo-400" />
            <span>Putar Layar Mati</span>
          </div>
          {isWakeLockActive && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs animate-pulse" />
          )}
        </button>

        {/* AMOLED Black Screen Mode Shortcut */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-amoled-mode'))}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-purple-400" />
            <span>AMOLED Black Saver</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">0% Watt</span>
        </button>

        {/* Cloud Sync Status Pill */}
        <div
          onClick={() => setIsCloudModalOpen(true)}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-indigo-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="text-[11px] font-semibold text-slate-300">Supabase Cloud</span>
          </div>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              isCloudConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {isCloudConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
