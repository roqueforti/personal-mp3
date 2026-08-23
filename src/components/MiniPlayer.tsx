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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl safe-area-bottom">
      {/* Top Progress Bar */}
      <div className="w-full h-1 bg-slate-100 relative overflow-hidden">
        <div
          className="h-full bg-slate-900 transition-all duration-150 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left Section: Track Info */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
          onClick={() => setIsFullPlayerOpen(true)}
        >
          {/* Mini Album Art */}
          <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
            {currentSong.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-slate-400" />
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">
              {currentSong.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentSong.id);
            }}
            title="Favorit"
            className="p-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                currentSong.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-700'
              }`}
            />
          </button>

          {/* Previous (Desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playPrevious();
            }}
            title="Sebelumnya"
            className="p-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors hidden sm:inline-flex"
          >
            <SkipBack className="w-5 h-5 fill-slate-800" />
          </button>

          {/* Solid Black Play / Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            title="Berikutnya"
            className="p-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-slate-800" />
          </button>
        </div>
      </div>
    </div>
  );
}
