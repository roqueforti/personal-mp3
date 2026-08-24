'use client';

import React, { useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { formatTime } from '@/lib/formatters';
import AudioVisualizer from './AudioVisualizer';
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
  MoreHorizontal,
  Music,
  Disc3,
  CheckCircle2,
  Cloud,
  Loader2,
  Headphones,
  Sun,
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
    setIsBackgroundModalOpen,
    isWakeLockActive,
    toggleWakeLock,
    setSelectedSongForPlaylist,
    setIsPlaylistModalOpen,
    sleepTimer,
  } = useAudio();

  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dragDownOffset, setDragDownOffset] = useState(0);

  // Touch tracking references
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  if (!isFullPlayerOpen || !currentSong) return null;

  // Haptic feedback helper
  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Calculate index and previous/next songs for carousel
  const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
  const prevSong = currentIndex > 0 ? queue[currentIndex - 1] : queue[queue.length - 1];
  const nextSong = currentIndex < queue.length - 1 ? queue[currentIndex + 1] : queue[0];

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  // Touch Gesture Handlers for Horizontal Swipe (Track switch)
  const handleArtworkTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleArtworkTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only track horizontal swipes if dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeOffset(Math.max(-80, Math.min(80, deltaX)));
    }
  };

  const handleArtworkTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = swipeOffset;
    const elapsed = Date.now() - touchStartRef.current.time;

    if (deltaX < -40 || (deltaX < -20 && elapsed < 200)) {
      // Swiped Left -> Next Track
      triggerHaptic(15);
      playNext();
    } else if (deltaX > 40 || (deltaX > 20 && elapsed < 200)) {
      // Swiped Right -> Previous Track
      triggerHaptic(15);
      playPrevious();
    }

    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  // Touch Gesture for Drag-Down-to-Dismiss on Header
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (deltaY > 0) {
      setDragDownOffset(Math.min(150, deltaY));
    }
  };

  const handleHeaderTouchEnd = () => {
    if (dragDownOffset > 60) {
      triggerHaptic(10);
      setIsFullPlayerOpen(false);
    }
    setDragDownOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div
      style={{ transform: dragDownOffset > 0 ? `translateY(${dragDownOffset}px)` : undefined }}
      className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] select-none text-slate-900 animate-slide-up duration-200 max-w-lg mx-auto border-x border-slate-100 shadow-2xl transition-transform ease-out"
    >
      {/* Top Drag Handle & Header */}
      <div
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="cursor-grab active:cursor-grabbing border-b border-slate-100/80 bg-white"
      >
        {/* iOS Pull Down Bar Indicator */}
        <div className="pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pb-2.5">
          <button
            onClick={() => {
              triggerHaptic(5);
              setIsFullPlayerOpen(false);
            }}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-100 active:scale-90 transition-all"
            title="Tutup (Tarik ke Bawah)"
          >
            <ChevronDown className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Now Playing</h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {queue.length > 0 ? `Antrean ${currentIndex + 1} dari ${queue.length}` : 'SonicVault'}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic(5);
                setOptionsMenuOpen(!optionsMenuOpen);
              }}
              className="p-2 -mr-2 rounded-full text-slate-800 hover:bg-slate-100 active:scale-90 transition-all"
              title="Menu Pilihan"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>

            {/* Options Dropdown Menu */}
            {optionsMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOptionsMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1 text-xs font-semibold text-slate-700 animate-scale-up">
                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setShowQueue(!showQueue);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800 active:scale-95"
                  >
                    <ListMusic className="w-4 h-4 text-slate-600" />
                    {showQueue ? 'Tutup Antrean' : 'Lihat Antrean Lagu'}
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setIsEqualizerOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800 active:scale-95"
                  >
                    <Sliders className="w-4 h-4 text-slate-600" />
                    5-Band Equalizer
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setIsBackgroundModalOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800 active:scale-95"
                  >
                    <Headphones className="w-4 h-4 text-indigo-500" />
                    Putar Saat Layar Mati {isWakeLockActive ? '(Layar Aktif)' : ''}
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setIsSleepTimerOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800 active:scale-95"
                  >
                    <Moon className="w-4 h-4 text-amber-500" />
                    Sleep Timer {sleepTimer.active ? `(${sleepTimer.minutesRemaining}m)` : ''}
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setSelectedSongForPlaylist(currentSong);
                      setIsPlaylistModalOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800 active:scale-95"
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
                            triggerHaptic(5);
                            setPlaybackRate(rate);
                            setOptionsMenuOpen(false);
                          }}
                          className={`py-1 text-[11px] font-bold rounded-lg text-center transition-all active:scale-90 ${
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
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-2">
        {showQueue ? (
          /* Queue Screen */
          <div className="flex-1 flex flex-col my-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Daftar Antrean ({queue.length})</h3>
              <button
                onClick={() => {
                  triggerHaptic(5);
                  setShowQueue(false);
                }}
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
                    onClick={() => {
                      triggerHaptic(10);
                      playSong(song);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
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
          /* Touch-Swipeable Album Artwork Carousel Screen */
          <div className="flex flex-col items-center">
            {/* Artwork Container with Native Touch Drag */}
            <div
              onTouchStart={handleArtworkTouchStart}
              onTouchMove={handleArtworkTouchMove}
              onTouchEnd={handleArtworkTouchEnd}
              className="relative w-full flex items-center justify-center overflow-hidden my-2 cursor-grab active:cursor-grabbing select-none"
            >
              {/* Left Preview Card */}
              {prevSong && prevSong.id !== currentSong.id && (
                <div
                  onClick={() => {
                    triggerHaptic(10);
                    playPrevious();
                  }}
                  className="absolute -left-20 w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden opacity-40 scale-90 blur-[0.5px] cursor-pointer shadow-md bg-slate-100 flex items-center justify-center border border-slate-200 transition-all active:scale-95"
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

              {/* Main Center Active Card (Translates with touch swipe gesture) */}
              <div
                style={{
                  transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px) scale(0.98)` : undefined,
                  transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
                className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 shadow-2xl shadow-slate-200/90 border border-slate-100 z-10 flex items-center justify-center"
              >
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
                  onClick={() => {
                    triggerHaptic(10);
                    playNext();
                  }}
                  className="absolute -right-20 w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden opacity-40 scale-90 blur-[0.5px] cursor-pointer shadow-md bg-slate-100 flex items-center justify-center border border-slate-200 transition-all active:scale-95"
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

            {/* Gesture Hint & Dot Indicators */}
            <div className="flex items-center gap-1.5 mt-3 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-1.5 rounded-full bg-slate-900 transition-all" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Title & Artist */}
            <div className="text-center px-4 mt-1 mb-1 space-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate leading-snug">
                {currentSong.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500 truncate">
                {currentSong.artist}
              </p>

              {/* Status Badge */}
              <div className="pt-1 flex items-center justify-center">
                {currentSong.blob ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Offline Ready
                  </span>
                ) : isCaching && cachingSongId === currentSong.id ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold shadow-2xs animate-pulse">
                    <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                    Menyimpan Otomatis...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-bold shadow-2xs">
                    <Cloud className="w-3 h-3 text-slate-500" />
                    Cloud Streaming
                  </span>
                )}
              </div>
            </div>

            {/* Integrated Real-time Audio Visualizer */}
            <div className="w-full max-w-xs px-2 pt-2">
              <AudioVisualizer isPlaying={isPlaying} barCount={26} className="h-6 w-full opacity-85" />
            </div>
          </div>
        )}

        {/* Dual-Layer Buffered Seekbar and Timing */}
        <div className="w-full px-2 mt-2 space-y-1.5">
          {(() => {
            const activeDuration = duration > 0 ? duration : (currentSong.duration || 0);
            const playedPercent = activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0;
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
                  max={activeDuration || 100}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Scrubber Thumb */}
                <div
                  className="absolute w-3.5 h-3.5 bg-slate-900 border-2 border-white rounded-full shadow-md pointer-events-none -ml-1.5 transition-transform group-hover:scale-125"
                  style={{ left: `${playedPercent}%` }}
                />
              </div>
            );
          })()}

          {/* Time Labels */}
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span className="font-mono text-slate-600">{formatTime(currentTime)}</span>
            <span className="font-mono text-slate-600">
              {formatTime(duration > 0 ? duration : (currentSong.duration || 0))}
            </span>
          </div>
        </div>

        {/* Main Controls Row with Native Active Touch Physics */}
        <div className="flex items-center justify-between px-3 mt-4">
          {/* Favorite Heart */}
          <button
            onClick={() => {
              triggerHaptic(15);
              toggleFavorite(currentSong.id);
            }}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 active:scale-75 transition-transform"
            title="Favorit"
          >
            <Heart
              className={`w-5 h-5 ${
                currentSong.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-900'
              }`}
            />
          </button>

          {/* Previous */}
          <button
            onClick={() => {
              triggerHaptic(10);
              playPrevious();
            }}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 active:scale-75 transition-transform"
            title="Sebelumnya (atau Geser Kanan pada Cover)"
          >
            <SkipBack className="w-6 h-6 fill-slate-900" />
          </button>

          {/* Big Solid Circular Play/Pause */}
          <button
            onClick={() => {
              triggerHaptic(15);
              togglePlay();
            }}
            disabled={isLoadingAudio}
            className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => {
              triggerHaptic(10);
              playNext();
            }}
            className="p-2.5 rounded-full text-slate-900 hover:bg-slate-100 active:scale-75 transition-transform"
            title="Berikutnya (atau Geser Kiri pada Cover)"
          >
            <SkipForward className="w-6 h-6 fill-slate-900" />
          </button>

          {/* Repeat / Shuffle Mode */}
          <button
            onClick={() => {
              triggerHaptic(10);
              cycleRepeatMode();
            }}
            className={`p-2.5 rounded-full active:scale-75 transition-transform ${
              repeatMode !== 'off' ? 'text-slate-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title={`Mode Ulang: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom "Next:" Caption */}
        {nextSong && nextSong.id !== currentSong.id && (
          <div
            onClick={() => {
              triggerHaptic(10);
              playNext();
            }}
            className="text-center mt-5 py-1 cursor-pointer group active:scale-95 transition-transform"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Track:</p>
            <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-xs mx-auto mt-0.5">
              {nextSong.title} – {nextSong.artist}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
