'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { formatTime } from '@/lib/formatters';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  Moon,
  Maximize2,
  Music,
  CheckCircle2,
  Loader2,
  Headphones,
  ListMusic,
} from 'lucide-react';

export default function DesktopBottomPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    bufferedPercentage,
    volume,
    playbackRate,
    isShuffle,
    repeatMode,
    isCaching,
    cachingSongId,
    sleepTimer,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeatMode,
    toggleFavorite,
    setIsFullPlayerOpen,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsBackgroundModalOpen,
  } = useAudio();

  const [prevVolume, setPrevVolume] = useState(volume || 1);

  if (!currentSong) return null;

  const activeDuration = duration > 0 ? duration : (currentSong.duration || 0);
  const playedPercent = activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0;
  const bufferedPercent = Math.min(100, Math.max(playedPercent, bufferedPercentage));

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 h-24 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 z-50 px-6 items-center justify-between shadow-2xl select-none hidden md:flex">
      {/* 1. Left Section: Track Metadata & Like (Spotify Web style) */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        {/* Album Artwork with Caching / Local indicator */}
        <div
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer shadow-xs group"
          onClick={() => setIsFullPlayerOpen(true)}
          title="Buka Player Penuh"
        >
          {currentSong.coverArt ? (
            <img
              src={currentSong.coverArt}
              alt={currentSong.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Music className="w-6 h-6" />
            </div>
          )}

          {/* Downloaded Badge */}
          {currentSong.blob ? (
            <div
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
              title="Tersimpan di Vault Offline"
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
            </div>
          ) : isCaching && cachingSongId === currentSong.id ? (
            <div
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs animate-spin"
              title="Mengunduh ke Vault..."
            >
              <Loader2 className="w-2.5 h-2.5" />
            </div>
          ) : null}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <h4
            className="text-sm font-bold text-slate-900 truncate hover:underline cursor-pointer"
            onClick={() => setIsFullPlayerOpen(true)}
          >
            {currentSong.title}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5">{currentSong.artist}</p>
        </div>

        {/* Like Button */}
        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className="p-2 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
          title={currentSong.favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
        >
          <Heart
            className={`w-5 h-5 ${
              currentSong.favorite
                ? 'fill-rose-500 text-rose-500'
                : 'hover:text-rose-500'
            }`}
          />
        </button>
      </div>

      {/* 2. Center Section: Playback Controls & Dual-Layer Seekbar */}
      <div className="flex flex-col items-center w-2/4 max-w-xl px-4">
        {/* Buttons Row */}
        <div className="flex items-center gap-5 mb-1.5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-900'
            }`}
            title={`Acak: ${isShuffle ? 'Aktif' : 'Nonaktif'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            className="p-2 rounded-full text-slate-700 hover:text-slate-900 active:scale-90 transition-transform"
            title="Lagu Sebelumnya"
          >
            <SkipBack className="w-5 h-5 fill-slate-700 hover:fill-slate-900" />
          </button>

          {/* Play / Pause Solid Circle */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            className="p-2 rounded-full text-slate-700 hover:text-slate-900 active:scale-90 transition-transform"
            title="Lagu Berikutnya"
          >
            <SkipForward className="w-5 h-5 fill-slate-700 hover:fill-slate-900" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={cycleRepeatMode}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off'
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-slate-400 hover:text-slate-900'
            }`}
            title={`Mode Ulang: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Dual-Layer Scrub Bar & Time Labels */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 h-3 flex items-center group cursor-pointer">
            {/* Background Rail */}
            <div className="absolute inset-x-0 h-1 bg-slate-200 rounded-full overflow-hidden">
              {/* Buffered Bar */}
              <div
                className="h-full bg-slate-300 transition-all duration-300"
                style={{ width: `${bufferedPercent}%` }}
              />
            </div>

            {/* Played Bar */}
            <div
              className="absolute left-0 h-1 bg-slate-900 rounded-full group-hover:bg-emerald-600 transition-all duration-75"
              style={{ width: `${playedPercent}%` }}
            />

            {/* Range Input */}
            <input
              type="range"
              min={0}
              max={activeDuration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            {/* Scrubber Thumb */}
            <div
              className="absolute w-3 h-3 bg-slate-900 group-hover:bg-emerald-600 border-2 border-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -ml-1.5 pointer-events-none"
              style={{ left: `${playedPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 w-10">
            {formatTime(activeDuration)}
          </span>
        </div>
      </div>

      {/* 3. Right Section: Volume Slider, EQ, Layar Mati & Maximize */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Equalizer */}
        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="5-Band Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Layar Mati & Background settings */}
        <button
          onClick={() => setIsBackgroundModalOpen(true)}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Pengaturan Layar Mati"
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Sleep Timer */}
        <button
          onClick={() => setIsSleepTimerOpen(true)}
          className={`p-2 rounded-full transition-colors ${
            sleepTimer.active
              ? 'text-amber-600 bg-amber-50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Sleep Timer"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Volume Slider Section */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={handleMuteToggle}
            className="p-1.5 text-slate-500 hover:text-slate-900"
            title={volume === 0 ? 'Bunyikan' : 'Bisukan'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Volume Rail */}
          <div className="relative w-24 h-3 flex items-center cursor-pointer">
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 group-hover:bg-emerald-600 transition-all duration-75"
                style={{ width: `${(volume || 0) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
        </div>

        {/* Maximize to Full Player modal */}
        <button
          onClick={() => setIsFullPlayerOpen(true)}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1"
          title="Tampilan Penuh"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
