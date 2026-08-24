'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Lock, Moon, Music, ShieldCheck, Unlock } from 'lucide-react';

export default function AMOLEDBlackScreenOverlay() {
  const { currentSong, isPlaying } = useAudio();
  const [isActive, setIsActive] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const wakeLockSentinelRef = useRef<any>(null);

  // Auto-acquire Screen Wake Lock when AMOLED mode is active
  useEffect(() => {
    if (isActive) {
      if ('wakeLock' in navigator) {
        (navigator as any).wakeLock
          .request('screen')
          .then((sentinel: any) => {
            wakeLockSentinelRef.current = sentinel;
          })
          .catch(() => {});
      }
    } else {
      if (wakeLockSentinelRef.current) {
        try {
          wakeLockSentinelRef.current.release();
        } catch {}
        wakeLockSentinelRef.current = null;
      }
    }
  }, [isActive]);

  // Update minimal clock every second while active
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

  // Listen to custom event to toggle AMOLED mode
  useEffect(() => {
    const handleToggle = () => {
      setIsActive((prev) => {
        const next = !prev;
        if (next && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([15, 30]);
        }
        return next;
      });
    };
    window.addEventListener('toggle-amoled-mode', handleToggle);
    return () => window.removeEventListener('toggle-amoled-mode', handleToggle);
  }, []);

  // Hold-to-Unlock Engine (Guarantees zero accidental touches in pocket)
  const HOLD_DURATION_MS = 1800; // 1.8 seconds continuous hold required

  const startHold = (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent default touch behaviors like pull-to-refresh or text selection
    if (e.cancelable) e.preventDefault();

    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      // Subtle haptic tick at 50%
      if (progress > 48 && progress < 54 && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

      if (elapsed >= HOLD_DURATION_MS) {
        // Unlock successful!
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(0);
        setIsActive(false);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 60, 20]);
        }
      }
    }, 25);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black text-slate-400 select-none flex flex-col items-center justify-between p-6 touch-none cursor-default"
      style={{ backgroundColor: '#000000' }}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Bar: Minimal Dimmed Clock & Pocket Shield Status */}
      <div className="w-full flex items-center justify-between opacity-30 pt-3">
        <div className="text-sm font-mono tracking-widest text-white">{currentTimeStr}</div>
        <div className="flex items-center gap-1.5 text-xs text-white">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kunci Saku Aktif</span>
        </div>
      </div>

      {/* Center Area: Ultra-Dim Music Info + Hold-to-Unlock Ring */}
      <div className="text-center space-y-5 max-w-xs flex flex-col items-center">
        {/* Subtle Pulse Icon */}
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-30">
          <Music className="w-7 h-7 text-white animate-pulse" />
        </div>

        {/* Song Info (Minimal Dim) */}
        <div className="opacity-30 space-y-1">
          <div className="text-sm font-bold text-white truncate max-w-[240px]">
            {currentSong?.title || 'Lagu Sedang Diputar'}
          </div>
          <div className="text-xs text-slate-400 truncate max-w-[240px]">
            {currentSong?.artist || 'SonicVault'}
          </div>
        </div>

        {/* Hold to Unlock Circular / Pill Widget */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isHolding ? 'scale-110 opacity-90' : 'scale-100 opacity-35'
            }`}
          >
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-white/10"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-emerald-400 transition-all duration-75"
                strokeWidth="6"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * holdProgress) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Center Lock Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-white">
              {holdProgress >= 90 ? (
                <Unlock className="w-7 h-7 text-emerald-400 animate-bounce" />
              ) : (
                <Lock className={`w-7 h-7 ${isHolding ? 'text-emerald-400' : 'text-white'}`} />
              )}
            </div>
          </div>

          <div className="text-center transition-opacity duration-200">
            {isHolding ? (
              <p className="text-xs font-bold text-emerald-400 tracking-wide animate-pulse">
                Tahan terus... ({Math.round(holdProgress)}%)
              </p>
            ) : (
              <p className="text-[11px] font-medium text-slate-400 opacity-40">
                Sentuh & tahan 2 detik untuk membuka
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-center opacity-30 pb-3 space-y-0.5">
        <p className="text-[11px] font-medium text-white">
          Piksel layar padam 100% • Aman masuk saku tanpa kepencet
        </p>
        <p className="text-[10px] text-slate-400">
          Sentuhan acak di saku terblokir otomatis oleh Pocket Shield
        </p>
      </div>
    </div>
  );
}
