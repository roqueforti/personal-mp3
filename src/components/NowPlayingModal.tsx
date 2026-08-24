'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { formatTime } from '@/lib/formatters';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Sliders,
  Moon,
  ListMusic,
  ListPlus,
  Gauge,
  MoreHorizontal,
  Music,
  Disc3,
  X,
  CheckCircle2,
  Cloud,
  Loader2,
  DownloadCloud,
} from 'lucide-react';

export default function NowPlayingModal() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffle,
    playbackRate,
    isLoadingAudio,
    bufferedPercentage,
    isCaching,
    cachingSongId,
    queue,
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    setPlaybackRate,
    toggleFavorite,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setSelectedSongForPlaylist,
    setIsPlaylistModalOpen,
    sleepTimer,
  } = useAudio();

  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  if (!isFullPlayerOpen || !currentSong) return null;

  // Calculate index and previous/next songs for carousel
  const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
  const prevSong = currentIndex > 0 ? queue[currentIndex - 1] : queue[queue.length - 1];
  const nextSong = currentIndex < queue.length - 1 ? queue[currentIndex + 1] : queue[0];

  const remainingSeconds = Math.max(0, duration - currentTime);
  const formattedRemaining = remainingSeconds > 0 ? `-${formatTime(remainingSeconds)}` : '0:00';

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-y-auto pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] select-none text-slate-900 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
          title="Tutup"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <h2 className="text-base font-bold text-slate-900 tracking-tight">Now Playing</h2>

        <div className="relative">
          <button
            onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
            className="p-2 -mr-2 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
            title="Menu Pilihan"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>

          {/* Options Dropdown Menu */}
          {optionsMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOptionsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 space-y-1 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => {
                    setShowQueue(!showQueue);
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800"
                >
                  <ListMusic className="w-4 h-4 text-slate-600" />
                  {showQueue ? 'Tutup Antrean' : 'Lihat Antrean Lagu'}
                </button>

                <button
                  onClick={() => {
                    setIsEqualizerOpen(true);
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800"
                >
                  <Sliders className="w-4 h-4 text-slate-600" />
                  5-Band Equalizer
                </button>

                <button
                  onClick={() => {
                    setIsSleepTimerOpen(true);
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800"
                >
                  <Moon className="w-4 h-4 text-amber-500" />
                  Sleep Timer {sleepTimer.active ? `(${sleepTimer.minutesRemaining}m)` : ''}
                </button>

                <button
                  onClick={() => {
                    setSelectedSongForPlaylist(currentSong);
                    setIsPlaylistModalOpen(true);
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800"
                >
                  <ListPlus className="w-4 h-4 text-emerald-600" />
                  Tambah ke Playlist
                </button>

                <div className="pt-1.5 border-t border-slate-100">
                  <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">Kecepatan</p>
                  <div className="grid grid-cols-5 gap-1 px-1">
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setOptionsMenuOpen(false);
                        }}
                        className={`py-1 text-[11px] font-bold rounded-lg text-center transition-colors ${
                          playbackRate === rate
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-2">
        {showQueue ? (
          /* Queue Screen */
          <div className="flex-1 flex flex-col my-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Daftar Antrean ({queue.length})</h3>
              <button
                onClick={() => setShowQueue(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Kembali
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
              {queue.map((song, idx) => {
                const isSelected = song.id === currentSong.id;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => playSong(song)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-mono w-4 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {song.coverArt ? (
                          <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {song.title}
                        </p>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {song.artist}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {formatTime(song.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Exact Carousel Cover Screen */
          <div className="flex flex-col items-center">
            {/* Carousel Artwork Container */}
            <div className="relative w-full flex items-center justify-center overflow-hidden my-3">
              {/* Left Preview Card */}
              {prevSong && prevSong.id !== currentSong.id && (
                <div
                  onClick={playPrevious}
                  className="absolute -left-20 w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden opacity-40 scale-90 blur-[0.5px] cursor-pointer shadow-md bg-slate-100 flex items-center justify-center border border-slate-200 transition-all"
                >
                  {prevSong.coverArt ? (
                    <img src={prevSong.coverArt} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Music className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Main Center Active Card */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 shadow-xl shadow-slate-200/80 border border-slate-100 z-10 flex items-center justify-center">
                {currentSong.coverArt ? (
                  <img
                    src={currentSong.coverArt}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex flex-col items-center justify-center p-6 text-center">
                    <div className={`w-28 h-28 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center shadow-md ${isPlaying ? 'animate-spin-slow' : ''}`}>
                      <Disc3 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Preview Card */}
              {nextSong && nextSong.id !== currentSong.id && (
                <div
                  onClick={playNext}
                  className="absolute -right-20 w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden opacity-40 scale-90 blur-[0.5px] cursor-pointer shadow-md bg-slate-100 flex items-center justify-center border border-slate-200 transition-all"
                >
                  {nextSong.coverArt ? (
                    <img src={nextSong.coverArt} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Music className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center gap-1.5 mt-4 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Title & Artist */}
            <div className="text-center px-4 mt-1 mb-2 space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate leading-snug">
                {currentSong.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 truncate">
                {currentSong.artist}
              </p>

              {/* Streaming & Auto-Cache Status Badge */}
              <div className="pt-1 flex items-center justify-center">
                {currentSong.blob ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Tersimpan di HP (Offline Ready)
                  </span>
                ) : isCaching && cachingSongId === currentSong.id ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold shadow-xs animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    Streaming & Menyimpan Otomatis...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-[11px] font-bold shadow-xs">
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                    Cloud Streaming
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dual-Layer Buffered Seekbar and Timing */}
        <div className="w-full px-2 mt-4 space-y-2">
          {(() => {
            const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
            const bufferedPercent = Math.min(100, Math.max(playedPercent, bufferedPercentage));

            return (
              <div className="relative w-full h-4 flex items-center group cursor-pointer">
                {/* Background Rail */}
                <div className="absolute inset-x-0 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                  {/* Buffered Progress Bar (Gray) */}
                  <div
                    className="h-full bg-slate-300 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                </div>

                {/* Played Progress Bar (Black) */}
                <div
                  className="absolute left-0 h-1.5 bg-slate-900 rounded-full pointer-events-none transition-all duration-75"
                  style={{ width: `${playedPercent}%` }}
                />

                {/* Native Range Input for Interaction */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Scrubber Thumb */}
                <div
                  className="absolute w-3.5 h-3.5 bg-slate-900 border-2 border-white rounded-full shadow-md pointer-events-none transition-transform group-hover:scale-125"
                  style={{
                    left: `calc(${playedPercent}% - 7px)`,
                  }}
                />
              </div>
            );
          })()}

          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formattedRemaining}</span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between px-4 mt-6">
          {/* Favorite Heart */}
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 transition-colors"
            title="Favorit"
          >
            <Heart
              className={`w-6 h-6 ${
                currentSong.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-900'
              }`}
            />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 active:scale-90 transition-transform"
            title="Sebelumnya"
          >
            <SkipBack className="w-7 h-7 fill-slate-900" />
          </button>

          {/* Big Solid Circular Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 active:scale-90 transition-transform"
            title="Berikutnya"
          >
            <SkipForward className="w-7 h-7 fill-slate-900" />
          </button>

          {/* Repeat / Shuffle Mode */}
          <button
            onClick={cycleRepeatMode}
            className={`p-2.5 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-slate-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title={`Mode Ulang: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-6 h-6" />
            ) : (
              <Repeat className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Bottom "Next:" Caption */}
        {nextSong && nextSong.id !== currentSong.id && (
          <div
            onClick={playNext}
            className="text-center mt-8 py-1 cursor-pointer group"
          >
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Next:</p>
            <p className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 truncate max-w-xs mx-auto mt-0.5">
              {nextSong.title} – {nextSong.artist}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
