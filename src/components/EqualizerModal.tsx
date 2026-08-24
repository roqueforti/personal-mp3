'use client';

import React, { useState, useRef } from 'react';
import {
  useAudio,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
} from '@/context/AudioContext';
import { EqualizerPresetName } from '@/types/music';
import { X, ArrowLeft, Sliders, RotateCcw } from 'lucide-react';

const FREQ_LABELS = ['60 Hz\n(Bass)', '230 Hz\n(Low)', '910 Hz\n(Mid)', '3.6 kHz\n(High Mid)', '14 kHz\n(Treble)'];

export default function EqualizerModal() {
  const {
    isEqualizerOpen,
    setIsEqualizerOpen,
    eqPreset,
    eqGains,
    setEqPreset,
    setEqGain,
  } = useAudio();

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (!isEqualizerOpen) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const presets = Object.keys(EQUALIZER_PRESETS) as EqualizerPresetName[];

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
      setIsEqualizerOpen(false);
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
              setIsEqualizerOpen(false);
            }}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 active:scale-90 transition-transform"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">5-Band Equalizer</h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">Sesuaikan karakter suara musikmu</p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic(5);
            setIsEqualizerOpen(false);
          }}
          className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-5 flex-1 overflow-y-auto pb-24">
        {/* Preset Buttons Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preset Audio</span>
            <button
              onClick={() => {
                triggerHaptic(10);
                setEqPreset('Flat');
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 active:scale-95 transition-transform"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Flat
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {presets.map((name) => (
              <button
                key={name}
                onClick={() => {
                  triggerHaptic(10);
                  setEqPreset(name);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all active:scale-95 ${
                  eqPreset === name
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Band Sliders */}
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[11px] font-mono font-bold text-slate-500">+12 dB</span>
            <span className="text-[11px] font-mono font-bold text-slate-400">0 dB</span>
            <span className="text-[11px] font-mono font-bold text-slate-500">-12 dB</span>
          </div>

          <div className="grid grid-cols-5 gap-1 items-center justify-items-center w-full">
            {EQUALIZER_FREQUENCIES.map((freq, idx) => {
              const gain = eqGains[idx] || 0;
              return (
                <div key={freq} className="flex flex-col items-center gap-1.5 h-44 w-full max-w-[60px] overflow-hidden">
                  {/* Gain dB Indicator */}
                  <span className="text-[10px] font-mono font-bold text-slate-900">
                    {gain > 0 ? `+${gain}` : gain}dB
                  </span>

                  {/* Vertical Slider Wrapper */}
                  <div className="relative flex-1 flex items-center justify-center w-6 overflow-visible">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => setEqGain(idx, parseFloat(e.target.value))}
                      className="accent-slate-900 w-28 h-2 bg-slate-200 rounded-lg cursor-pointer transform -rotate-90 origin-center"
                    />
                  </div>

                  {/* Frequency Label */}
                  <span className="text-[9px] text-center font-bold text-slate-600 whitespace-pre-line leading-tight truncate w-full">
                    {FREQ_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
