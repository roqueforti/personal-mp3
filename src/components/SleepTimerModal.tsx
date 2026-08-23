'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { X, Moon, Clock, Check, StopCircle, Disc } from 'lucide-react';

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

  if (!isSleepTimerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Sleep Timer</h3>
              <p className="text-xs text-slate-400">Audio berhenti otomatis saat kamu tidur</p>
            </div>
          </div>

          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Active Timer Banner */}
          {sleepTimer.active ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">Sleep Timer Aktif</p>
                  <p className="text-sm font-bold text-white">
                    {sleepTimer.endOfTrack
                      ? 'Berhenti di akhir lagu ini'
                      : `Sisa ~${sleepTimer.minutesRemaining} menit lagi`}
                  </p>
                </div>
              </div>

              <button
                onClick={cancelSleepTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                Matikan
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Pilih berapa lama musik akan diputar sebelum berhenti otomatis dengan efek fade out:
            </p>
          )}

          {/* Preset Buttons */}
          <div className="space-y-2">
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => {
                  startSleepTimer(opt.minutes);
                  setIsSleepTimerOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised hover:bg-surface-active border border-border text-slate-200 hover:text-white transition-all text-sm font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {opt.label}
                </span>
                {sleepTimer.active && !sleepTimer.endOfTrack && sleepTimer.totalMinutes === opt.minutes && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </button>
            ))}

            {/* End of Current Track Option */}
            <button
              onClick={() => {
                startSleepTimer(0, true);
                setIsSleepTimerOpen(false);
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised hover:bg-surface-active border border-border text-slate-200 hover:text-white transition-all text-sm font-medium"
            >
              <span className="flex items-center gap-2.5">
                <Disc className="w-4 h-4 text-indigo-400" />
                Berhenti Setelah Lagu Ini Selesai
              </span>
              {sleepTimer.active && sleepTimer.endOfTrack && (
                <Check className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex justify-end">
          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="px-5 py-2 rounded-xl border border-border text-slate-300 text-xs font-semibold hover:bg-surface transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
