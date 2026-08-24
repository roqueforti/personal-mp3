'use client';

import React, { useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { X, ArrowLeft, Moon, Clock, Check, StopCircle, Disc } from 'lucide-react';

const TIMER_OPTIONS = [
  { label: '5 Menit', minutes: 5 },
  { label: '15 Menit', minutes: 15 },
  { label: '30 Menit', minutes: 30 },
  { label: '45 Menit', minutes: 45 },
  { label: '60 Menit (1 Jam)', minutes: 60 },
  { label: '90 Menit', minutes: 90 },
];

export default function SleepTimerModal() {
  const {
    isSleepTimerOpen,
    setIsSleepTimerOpen,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
  } = useAudio();

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (!isSleepTimerOpen) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Edge Swipe Back gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < 50) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 75) {
      triggerHaptic(10);
      setIsSleepTimerOpen(false);
    }
    setDragOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragOffset > 0 ? `translateX(${dragOffset}px)` : undefined,
        transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
      }}
      className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-page-push select-none max-w-lg mx-auto border-x border-slate-100 shadow-2xl"
    >
      {/* Native Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic(5);
              setIsSleepTimerOpen(false);
            }}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 active:scale-90 transition-transform"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Sleep Timer</h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">Audio berhenti otomatis saat tidur</p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic(5);
            setIsSleepTimerOpen(false);
          }}
          className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-1 overflow-y-auto pb-24">
        {/* Active Timer Banner */}
        {sleepTimer.active ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-amber-800">Sleep Timer Aktif</p>
                <p className="text-sm font-bold text-slate-900">
                  {sleepTimer.endOfTrack
                    ? 'Berhenti di akhir lagu ini'
                    : `Sisa ~${sleepTimer.minutesRemaining} menit lagi`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic(15);
                cancelSleepTimer();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold active:scale-95 transition-transform"
            >
              <StopCircle className="w-4 h-4" />
              Matikan
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-medium px-1">
            Pilih durasi musik diputar sebelum audio berhenti otomatis:
          </p>
        )}

        {/* Preset Buttons */}
        <div className="space-y-2.5">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => {
                triggerHaptic(10);
                startSleepTimer(opt.minutes);
                setIsSleepTimerOpen(false);
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 active:scale-[0.98] transition-all text-xs font-bold shadow-2xs"
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {opt.label}
              </span>
              {sleepTimer.active && !sleepTimer.endOfTrack && sleepTimer.totalMinutes === opt.minutes && (
                <Check className="w-4 h-4 text-slate-900 stroke-[3]" />
              )}
            </button>
          ))}

          {/* End of Current Track Option */}
          <button
            onClick={() => {
              triggerHaptic(10);
              startSleepTimer(0, true);
              setIsSleepTimerOpen(false);
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 active:scale-[0.98] transition-all text-xs font-bold shadow-2xs"
          >
            <span className="flex items-center gap-2.5">
              <Disc className="w-4 h-4 text-slate-700" />
              Berhenti Setelah Lagu Ini Selesai
            </span>
            {sleepTimer.active && sleepTimer.endOfTrack && (
              <Check className="w-4 h-4 text-slate-900 stroke-[3]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
