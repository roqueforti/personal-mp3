'use client';

import React from 'react';
import {
  useAudio,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
} from '@/context/AudioContext';
import { EqualizerPresetName } from '@/types/music';
import { X, Sliders, RotateCcw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">5-Band Equalizer</h3>
              <p className="text-xs text-slate-500 font-medium">Sesuaikan karakter audio sesuai seleramu</p>
            </div>
          </div>

          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
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
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Flat
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {presets.map((name) => (
                <button
                  key={name}
                  onClick={() => setEqPreset(name)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                    eqPreset === name
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Band Sliders */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-mono font-bold text-slate-500">+12 dB</span>
              <span className="text-xs font-mono font-bold text-slate-400">0 dB</span>
              <span className="text-xs font-mono font-bold text-slate-500">-12 dB</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center justify-items-center">
              {EQUALIZER_FREQUENCIES.map((freq, idx) => {
                const gain = eqGains[idx] || 0;
                return (
                  <div key={freq} className="flex flex-col items-center gap-2 h-44">
                    {/* Gain dB Indicator */}
                    <span className="text-[11px] font-mono font-bold text-slate-900">
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
                        className="w-28 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center"
                      />
                    </div>

                    {/* Frequency Label */}
                    <span className="text-[10px] font-bold text-slate-600 text-center whitespace-pre-line leading-tight">
                      {FREQ_LABELS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm transition-all shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
