'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import NativeConfirmModal from './NativeConfirmModal';

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
  const [confirmResetCache, setConfirmResetCache] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && isCloudModalOpen) {
      setSupabaseUrl(supabase.getSupabaseUrl());
      setSupabaseKey(supabase.getSupabaseAnonKey());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isCloudModalOpen]);

  if (!isCloudModalOpen) return null;

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
      setIsCloudModalOpen(false);
    }
    setDragOffset(0);
    touchStartRef.current = null;
  };

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
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic(5);
              setIsCloudModalOpen(false);
            }}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 active:scale-90 transition-transform"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
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
          onClick={() => {
            triggerHaptic(5);
            setIsCloudModalOpen(false);
          }}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 pb-24">
        {/* Status Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Status Sinkronisasi</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isCloudConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {isCloudConnected ? 'Terhubung' : 'Belum Terhubung'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hubungkan ke Supabase (Database PostgreSQL + Storage Bucket) pribadi Anda untuk streaming musik multi-device gratis dan sinkronisasi playlist.
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://abcdefghijkl.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:outline-none text-xs font-semibold text-slate-900 bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:outline-none text-xs font-semibold text-slate-900 font-mono bg-white shadow-2xs"
            />
          </div>

          {testMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : testStatus === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />}
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{testMessage}</span>
            </div>
          )}

          <button
            onClick={handleTestAndSave}
            disabled={testStatus === 'testing'}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {testStatus === 'testing' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Simpan & Tes Koneksi Supabase</span>
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-700" />
              <span>1-Click SQL Setup Script</span>
            </h4>
            <button
              onClick={copySql}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Salin SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Jalankan script SQL ini di dashboard Supabase (menu <strong>SQL Editor</strong>) untuk membuat tabel <code>songs</code>, <code>playlists</code>, dan storage bucket <code>songs</code> secara otomatis.
          </p>
        </div>

        {/* Action to open Music Studio */}
        <div className="pt-2">
          <button
            onClick={() => {
              triggerHaptic(10);
              setIsCloudModalOpen(false);
              setIsStudioOpen(true);
            }}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Buka Music Studio (Upload & Kelola Lagu)</span>
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
            onClick={() => {
              triggerHaptic(10);
              setConfirmResetCache(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-transform border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Cache</span>
          </button>
        </div>
      </div>

      {/* Native Reset Cache Confirm Dialog */}
      <NativeConfirmModal
        isOpen={confirmResetCache}
        title="Bersihkan Cache Lokal?"
        message="Hapus semua data cache lokal dan unduh ulang daftar lagu dari Supabase?"
        confirmText="Reset & Unduh Ulang"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={async () => {
          setConfirmResetCache(false);
          await clearAllLocalSongs();
          await syncWithCloud();
        }}
        onCancel={() => setConfirmResetCache(false)}
      />
    </div>
  );
}
