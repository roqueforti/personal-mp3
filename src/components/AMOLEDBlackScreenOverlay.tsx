'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Moon, Sparkles, X, Music } from 'lucide-react';

export default function AMOLEDBlackScreenOverlay() {
  const { currentSong, isPlaying, togglePlay, playNext, playPrevious } = useAudio();
  const [isActive, setIsActive] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [tapCount, setTapCount] = useState(0);

  // Update clock every second while active
  useEffect(() => {
    if (!isActive) return;

    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Handle double-tap to dismiss
  const handleTap = () => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        setIsActive(false);
        return 0;
      }
      return next;
    });

    setTimeout(() => {
      setTapCount(0);
    }, 400);
  };

  // Listen to custom event to toggle AMOLED mode
  useEffect(() => {
    const handleToggle = () => setIsActive((prev) => !prev);
    window.addEventListener('toggle-amoled-mode', handleToggle);
    return () => window.removeEventListener('toggle-amoled-mode', handleToggle);
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black text-slate-400 select-none flex flex-col items-center justify-between p-8 cursor-pointer touch-none"
      onClick={handleTap}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top Bar: Minimal Dimmed Clock */}
      <div className="w-full flex items-center justify-between opacity-30 pt-4">
        <div className="text-sm font-mono tracking-widest text-white">{currentTimeStr}</div>
        <div className="flex items-center gap-1.5 text-xs text-white">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>AMOLED Sleep Mode</span>
        </div>
      </div>

      {/* Center: Extremely Dim Song Info & Controls */}
      <div className="text-center space-y-4 opacity-25 max-w-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Music className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white truncate">
            {currentSong?.title || 'Lagu Sedang Diputar'}
          </div>
          <div className="text-xs text-slate-400 truncate">{currentSong?.artist || 'SonicVault'}</div>
        </div>

        {/* Quick Dim Controls */}
        <div
          className="flex items-center justify-center gap-6 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={playPrevious}
            className="p-3 text-white/50 active:text-white active:scale-95"
          >
            ⏮
          </button>
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-white/10 text-white active:scale-90"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={playNext}
            className="p-3 text-white/50 active:text-white active:scale-95"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center opacity-30 pb-4 space-y-1">
        <p className="text-[11px] tracking-wide text-white">
          Piksel layar padam 100% • HP hemat daya seperti mati
        </p>
        <p className="text-[10px] text-slate-400 font-medium">Ketuk layar 2x untuk keluar</p>
      </div>
    </div>
  );
}
