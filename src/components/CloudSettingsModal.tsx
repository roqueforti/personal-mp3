'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as supabase from '@/lib/supabase';
import {
  X,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Supabase Cloud Sync</span>
                {isCloudConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Penyimpanan Database & CDN Streaming Audio
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Studio Action */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md">
            <div>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                Music Studio
              </h4>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Upload MP3 baru, auto-detect ID3 tag, & kelola koleksi Supabase
              </p>
            </div>
            <button
              onClick={() => {
                setIsCloudModalOpen(false);
                setIsStudioOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Buka Studio</span>
            </button>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Test Status Banner */}
            {testStatus !== 'idle' && (
              <div
                className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}
              >
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                {testStatus === 'testing' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0 mt-0.5" />}
                <span>{testMessage}</span>
              </div>
            )}

            <button
              onClick={handleTestAndSave}
              disabled={testStatus === 'testing'}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Simpan & Tes Koneksi Supabase</span>
            </button>
          </div>

          {/* 1-Click SQL Setup Script */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-600" />
                SQL Setup Script (Tabel & Bucket Storage)
              </span>
              <button
                onClick={copySql}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL (1-Click)</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-36 border border-slate-800">
              {supabase.SUPABASE_SQL_SETUP}
            </pre>
          </div>

          {/* Reset / Bersihkan Lagu Lama */}
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-950">Bersihkan Semua Lagu Lama</h4>
              <p className="text-[11px] text-red-800 font-medium mt-0.5">
                Hapus seluruh cache lagu lama dari memori HP lokal untuk mulai fresh dengan Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (confirm('Hapus seluruh lagu lama dari memori HP lokal?')) {
                  await clearAllLocalSongs();
                  alert('Vault lokal berhasil dibersihkan!');
                  setIsCloudModalOpen(false);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => syncWithCloud()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Supabase'}</span>
          </button>

          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
