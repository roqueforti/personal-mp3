'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as supabase from '@/lib/supabase';
import {
  X,
  ArrowLeft,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Database,
  Trash2,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function CloudSettingsModal() {
  const {
    isCloudModalOpen,
    setIsCloudModalOpen,
    setIsStudioOpen,
    syncWithCloud,
    clearAllLocalSongs,
    isCloudConnected,
    isSyncing,
  } = useAudio();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && isCloudModalOpen) {
      setSupabaseUrl(supabase.getSupabaseUrl());
      setSupabaseKey(supabase.getSupabaseAnonKey());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isCloudModalOpen]);

  if (!isCloudModalOpen) return null;

  const handleTestAndSave = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestStatus('error');
      setTestMessage('Silakan masukkan Project URL dan Anon Key Supabase.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Menghubungkan ke Supabase...');

    supabase.setSupabaseConfig(supabaseUrl, supabaseKey);
    const result = await supabase.pingSupabase(supabaseUrl, supabaseKey);

    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message);
      await syncWithCloud();
    } else {
      setTestStatus('error');
      setTestMessage(result.message);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(supabase.SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-right duration-200 select-none max-w-lg mx-auto border-x border-slate-100 shadow-2xl">
      {/* Native Mobile Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Supabase Cloud Sync</span>
              {isCloudConnected && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                  Aktif
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Database & CDN Streaming Audio
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCloudModalOpen(false)}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 pb-24">
        {/* Connection Status Card */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isCloudConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCloudConnected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {isCloudConnected ? 'Database Cloud Terhubung' : 'Belum Terhubung ke Cloud'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isCloudConnected
                  ? 'Sinkronisasi instan aktif di semua perangkat'
                  : 'Masukkan kredensial Supabase di bawah'}
              </p>
            </div>
          </div>

          <button
            onClick={() => syncWithCloud()}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Project URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Supabase Project URL</label>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://xyzcompany.supabase.co"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs font-mono text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* Anon Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Supabase Anon API Key</label>
          <input
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="sb_publishable_... atau eyJhbGciOi..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs font-mono text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* Status Message */}
        {testMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              testStatus === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : testStatus === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            {testStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : testStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{testMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleTestAndSave}
            disabled={testStatus === 'testing'}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            {testStatus === 'testing' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Tes Koneksi & Simpan</span>
          </button>

          <button
            onClick={() => {
              setIsCloudModalOpen(false);
              setIsStudioOpen(true);
            }}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Buka Music Studio (Upload Lagu)</span>
          </button>
        </div>

        {/* Reset Cache */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">Reset Cache Lokal</p>
            <p className="text-[11px] text-slate-500">
              Bersihkan memori browser HP dan muat ulang dari Supabase
            </p>
          </div>
          <button
            onClick={async () => {
              if (confirm('Bersihkan seluruh cache lokal dan muat ulang dari Supabase?')) {
                await clearAllLocalSongs();
                await syncWithCloud();
              }
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
}
