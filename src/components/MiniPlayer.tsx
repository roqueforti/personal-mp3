'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Play, Pause, SkipForward, Heart, Music, Loader2, CheckCircle2 } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isLoadingAudio,
    bufferedPercentage,
    isCaching,
    cachingSongId,
    togglePlay,
    playNext,
    toggleFavorite,
    setIsFullPlayerOpen,
  } = useAudio();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = Math.min(100, Math.max(progress, bufferedPercentage));

  return (
    <div className="fixed bottom-16 left-3 right-3 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden animate-slide-up select-none">
      {/* Top Dual Progress Line (Buffered + Played) */}
      <div className="w-full h-1 bg-slate-100 relative overflow-hidden">
        {/* Buffered Chunk Bar */}
        <div
          className="absolute left-0 top-0 h-full bg-slate-300/80 transition-all duration-300 ease-out"
          style={{ width: `${buffered}%` }}
        />
        {/* Played Bar */}
        <div
          className="absolute left-0 top-0 h-full bg-slate-900 transition-all duration-150 ease-out z-10"
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
          <div className="w-11 h-11 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs relative">
            {currentSong.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-slate-400" />
            )}
            {/* Small Offline or Caching Badge on Album Art */}
            {currentSong.blob ? (
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            ) : isCaching && cachingSongId === currentSong.id ? (
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs animate-spin">
                <Loader2 className="w-2.5 h-2.5" />
              </div>
            ) : null}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1 pr-1">
            <h4 className="text-xs font-extrabold text-slate-900 truncate leading-tight">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1.5">
              <span>{currentSong.artist}</span>
              {isCaching && cachingSongId === currentSong.id && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
                  Mengunduh...
                </span>
              )}
            </p>
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
            disabled={isLoadingAudio}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            {isLoadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isPlaying ? (
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
