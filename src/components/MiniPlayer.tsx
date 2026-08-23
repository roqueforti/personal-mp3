'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Play, Pause, SkipForward, SkipBack, Heart, Music, Maximize2 } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    toggleFavorite,
    setIsFullPlayerOpen,
  } = useAudio();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-raised border-t border-border shadow-2xl safe-area-bottom">
      {/* Top Thin Progress Bar */}
      <div className="w-full h-1 bg-surface relative overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left Section: Track Info (Click to open full player) */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
          onClick={() => setIsFullPlayerOpen(true)}
        >
          {/* Mini Album Art */}
          <div className="w-11 h-11 rounded-xl bg-surface overflow-hidden border border-border flex-shrink-0 flex items-center justify-center shadow-md">
            {currentSong.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-primary-400" />
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate leading-tight flex items-center gap-1.5">
              <span>{currentSong.title}</span>
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentSong.id);
            }}
            title={currentSong.favorite ? 'Favorit' : 'Tambah Favorit'}
            className={`p-2 rounded-xl transition-colors ${
              currentSong.favorite ? 'text-rose-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${currentSong.favorite ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playPrevious();
            }}
            title="Lagu Sebelumnya"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-surface-active transition-colors hidden sm:inline-flex"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-primary/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            title="Lagu Berikutnya"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-surface-active transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Expand Full Player Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullPlayerOpen(true);
            }}
            title="Buka Player Penuh"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-active transition-colors hidden md:inline-flex"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
