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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Sleep Timer</h3>
              <p className="text-xs text-slate-500 font-medium">Audio berhenti otomatis saat kamu tidur</p>
            </div>
          </div>

          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Active Timer Banner */}
          {sleepTimer.active ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
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
                onClick={cancelSleepTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                Matikan
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
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
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all text-sm font-bold"
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {opt.label}
                </span>
                {sleepTimer.active && !sleepTimer.endOfTrack && sleepTimer.totalMinutes === opt.minutes && (
                  <Check className="w-4 h-4 text-slate-900" />
                )}
              </button>
            ))}

            {/* End of Current Track Option */}
            <button
              onClick={() => {
                startSleepTimer(0, true);
                setIsSleepTimerOpen(false);
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all text-sm font-bold"
            >
              <span className="flex items-center gap-2.5">
                <Disc className="w-4 h-4 text-slate-700" />
                Berhenti Setelah Lagu Ini Selesai
              </span>
              {sleepTimer.active && sleepTimer.endOfTrack && (
                <Check className="w-4 h-4 text-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
