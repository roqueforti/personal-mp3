'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { formatTime, formatFileSize } from '@/lib/formatters';
import AudioVisualizer from '@/components/AudioVisualizer';
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
  Music,
  Disc3,
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

  const [showQueue, setShowQueue] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  if (!isFullPlayerOpen || !currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto safe-area-bottom select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2 rounded-xl bg-surface-raised hover:bg-surface-active text-slate-300 hover:text-white transition-colors"
          title="Tutup Player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-400">Sedang Diputar</p>
          <p className="text-xs text-slate-400 truncate max-w-[200px] font-medium">{currentSong.album}</p>
        </div>

        <button
          onClick={() => setShowQueue(!showQueue)}
          className={`p-2 rounded-xl border transition-colors ${
            showQueue
              ? 'bg-primary text-white border-primary'
              : 'bg-surface-raised hover:bg-surface-active text-slate-300 hover:text-white border-border'
          }`}
          title="Daftar Antrean"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Main Player Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-6 py-4 flex flex-col justify-between">
        {showQueue ? (
          /* Up Next Queue View */
          <div className="flex-1 flex flex-col my-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Antrean Lagu ({queue.length})</h3>
              <span className="text-xs text-slate-400">Ketuk untuk putar</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
              {queue.map((song, idx) => {
                const isSelected = song.id === currentSong.id;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => playSong(song)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-surface-active border-primary/50 text-white'
                        : 'bg-surface hover:bg-surface-raised border-border text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                      <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {song.coverArt ? (
                          <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary-400' : 'text-white'}`}>
                          {song.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{formatTime(song.duration)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Standard Player Screen */
          <div className="flex flex-col items-center flex-1 justify-center my-auto">
            {/* Album Cover Art */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 rounded-3xl overflow-hidden bg-surface-raised border-2 border-border shadow-2xl flex items-center justify-center group">
              {currentSong.coverArt ? (
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-raised to-surface-active flex flex-col items-center justify-center p-6 text-center">
                  <div className={`w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-700/80 flex items-center justify-center shadow-inner ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <Disc3 className="w-12 h-12 text-primary-400" />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-mono">SonicVault Audio</p>
                </div>
              )}
            </div>

            {/* Audio Wave Visualizer */}
            <div className="w-full max-w-xs my-2">
              <AudioVisualizer isPlaying={isPlaying} barCount={24} className="h-8 w-full" />
            </div>

            {/* Track Info */}
            <div className="w-full text-center mt-2 px-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{currentSong.title}</h2>
              <p className="text-sm font-medium text-slate-400 truncate mt-1">
                {currentSong.artist} <span className="opacity-40">•</span> {currentSong.album}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] font-mono text-slate-400">
                  MP3
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] font-mono text-slate-400">
                  {formatFileSize(currentSong.fileSize)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Playback Section */}
        <div className="w-full space-y-4 pt-4 border-t border-border/50">
          {/* Seekbar */}
          <div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400 mt-1.5 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-2">
            {/* Shuffle Button */}
            <button
              onClick={toggleShuffle}
              title={isShuffle ? 'Acak Aktif' : 'Acak Nonaktif'}
              className={`p-3 rounded-2xl transition-colors relative ${
                isShuffle
                  ? 'bg-primary/20 text-primary-400 border border-primary/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Track */}
            <button
              onClick={playPrevious}
              title="Lagu Sebelumnya"
              className="p-3 rounded-2xl text-slate-200 hover:text-white active:scale-90 transition-transform"
            >
              <SkipBack className="w-7 h-7 fill-slate-200" />
            </button>

            {/* Big Play / Pause Button */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Jeda' : 'Putar'}
              className="w-16 h-16 rounded-3xl bg-primary hover:bg-primary-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-xl shadow-primary/30 border border-primary-400/40"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white" />
              ) : (
                <Play className="w-7 h-7 fill-white ml-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={playNext}
              title="Lagu Berikutnya"
              className="p-3 rounded-2xl text-slate-200 hover:text-white active:scale-90 transition-transform"
            >
              <SkipForward className="w-7 h-7 fill-slate-200" />
            </button>

            {/* Repeat Mode Button */}
            <button
              onClick={cycleRepeatMode}
              title={`Mode Ulang: ${repeatMode}`}
              className={`p-3 rounded-2xl transition-colors relative ${
                repeatMode !== 'off'
                  ? 'bg-primary/20 text-primary-400 border border-primary/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Extra Tools Row */}
          <div className="flex items-center justify-around pt-2 border-t border-border">
            {/* Equalizer */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <Sliders className="w-4 h-4 text-primary-400" />
              <span className="text-[10px] font-medium">Equalizer</span>
            </button>

            {/* Sleep Timer */}
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors relative"
            >
              <Moon className={`w-4 h-4 ${sleepTimer.active ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="text-[10px] font-medium">
                {sleepTimer.active
                  ? sleepTimer.endOfTrack
                    ? 'Akhir Lagu'
                    : `${sleepTimer.minutesRemaining}m`
                  : 'Sleep'}
              </span>
            </button>

            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                <Gauge className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-medium">{playbackRate}x</span>
              </button>

              {speedMenuOpen && (
                <>
                  <div className="fixed inset-0 z-50" onClick={() => setSpeedMenuOpen(false)} />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-28 rounded-xl bg-surface-raised border border-border shadow-2xl p-1.5 z-50 space-y-1">
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setSpeedMenuOpen(false);
                        }}
                        className={`w-full py-1 text-xs font-semibold rounded-lg text-center transition-colors ${
                          playbackRate === rate
                            ? 'bg-primary text-white'
                            : 'text-slate-300 hover:bg-surface-active'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Add to Playlist */}
            <button
              onClick={() => {
                setSelectedSongForPlaylist(currentSong);
                setIsPlaylistModalOpen(true);
              }}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <ListPlus className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-medium">Playlist</span>
            </button>

            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className="flex flex-col items-center gap-1 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  currentSong.favorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-white'
                }`}
              />
              <span className="text-[10px] font-medium text-slate-400">Favorit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
