'use client';

import React from 'react';
import {
  useAudio,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
} from '@/context/AudioContext';
import { EqualizerPresetName } from '@/types/music';
import { X, Sliders, RotateCcw, Zap } from 'lucide-react';

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

  if (!isEqualizerOpen) return null;

  const presets = Object.keys(EQUALIZER_PRESETS) as EqualizerPresetName[];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">5-Band Equalizer</h3>
              <p className="text-xs text-slate-400">Sesuaikan karakter audio sesuai seleramu</p>
            </div>
          </div>

          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Preset Buttons Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preset Audio</span>
              <button
                onClick={() => setEqPreset('Flat')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Flat
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {presets.map((name) => (
                <button
                  key={name}
                  onClick={() => setEqPreset(name)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                    eqPreset === name
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-surface-raised hover:bg-surface-active text-slate-300 border-border'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Band Sliders */}
          <div className="bg-surface-raised p-4 rounded-2xl border border-border">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-mono text-slate-400">+12 dB</span>
              <span className="text-xs font-mono text-slate-500">0 dB</span>
              <span className="text-xs font-mono text-slate-400">-12 dB</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center justify-items-center">
              {EQUALIZER_FREQUENCIES.map((freq, idx) => {
                const gain = eqGains[idx] || 0;
                return (
                  <div key={freq} className="flex flex-col items-center gap-2 h-44">
                    {/* Gain dB Indicator */}
                    <span className="text-[11px] font-mono font-bold text-primary-400">
                      {gain > 0 ? `+${gain}` : gain} dB
                    </span>

                    {/* Vertical Slider */}
                    <div className="flex-1 flex items-center justify-center relative w-8">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        onChange={(e) => setEqGain(idx, parseFloat(e.target.value))}
                        className="w-28 h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary -rotate-90 origin-center"
                      />
                    </div>

                    {/* Frequency Label */}
                    <span className="text-[10px] font-semibold text-slate-400 text-center whitespace-pre-line leading-tight">
                      {FREQ_LABELS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex justify-end">
          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-semibold text-sm transition-all shadow-md shadow-primary/25"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
