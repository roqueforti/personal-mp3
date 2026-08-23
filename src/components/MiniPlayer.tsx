'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Play, Pause, SkipForward, Heart, Music } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    toggleFavorite,
    setIsFullPlayerOpen,
  } = useAudio();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 left-3 right-3 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden animate-slide-up select-none">
      {/* Top Progress Line */}
      <div className="w-full h-0.5 bg-slate-100 relative overflow-hidden">
        <div
          className="h-full bg-slate-900 transition-all duration-150 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="px-3.5 py-2 flex items-center justify-between gap-3">
        {/* Left Section: Track Info */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
          onClick={() => setIsFullPlayerOpen(true)}
        >
          {/* Mini Album Art */}
          <div className="w-11 h-11 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs">
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
          <div className="min-w-0 flex-1 pr-1">
            <h4 className="text-xs font-extrabold text-slate-900 truncate leading-tight">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentSong.id);
            }}
            className="p-2 rounded-full text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                currentSong.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-500'
              }`}
            />
          </button>

          {/* Solid Black Play / Pause Circle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="p-2 rounded-full text-slate-600 hover:text-slate-900 transition-colors"
          >
            <SkipForward className="w-4 h-4 fill-slate-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
