'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as cloudApi from '@/lib/cloudApi';
import * as db from '@/lib/db';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Database,
  UploadCloud,
  Loader2,
} from 'lucide-react';

export default function CloudSettingsModal() {
  const {
    songs,
    isCloudModalOpen,
    setIsCloudModalOpen,
    syncWithCloud,
    refreshSongs,
    isSyncing,
  } = useAudio();

  const [url, setUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Migration / Bulk Upload State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0, text: '' });
  const [migrationSuccess, setMigrationSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(cloudApi.getAppScriptUrl());
    }
  }, [isCloudModalOpen]);

  if (!isCloudModalOpen) return null;

  // Find local songs that haven't been uploaded to Google Drive yet
  const localOnlySongs = songs.filter((s) => !s.driveFileId);

  const handleSave = async () => {
    cloudApi.setAppScriptUrl(url);
    if (url) {
      await syncWithCloud();
    }
    setIsCloudModalOpen(false);
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestStatus('error');
      setTestMessage('Silakan masukkan Web App URL Google Apps Script Anda.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Mencoba menghubungi Google Apps Script...');

    const result = await cloudApi.pingCloud(url.trim());
    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message);
      cloudApi.setAppScriptUrl(url.trim());
    } else {
      setTestStatus('error');
      setTestMessage(result.message);
    }
  };

  const handleMigrateLocalSongs = async () => {
    if (!url.trim()) {
      alert('Silakan masukkan dan simpan Web App URL Google Apps Script terlebih dahulu.');
      return;
    }

    cloudApi.setAppScriptUrl(url.trim());
    setIsMigrating(true);
    setMigrationSuccess(false);

    try {
      const allDbSongs = await db.getAllSongs();
      const songsToUpload = allDbSongs.filter((s) => !s.driveFileId);
      const total = songsToUpload.length;

      setMigrationProgress({ current: 0, total, text: `Mempersiapkan ${total} lagu...` });

      for (let i = 0; i < total; i++) {
        const song = songsToUpload[i];
        setMigrationProgress({
          current: i + 1,
          total,
          text: `Mengunggah (${i + 1}/${total}): ${song.title}...`,
        });

        let audioBlob = song.blob;
        if (!audioBlob) {
          const full = await db.getSongById(song.id);
          audioBlob = full?.blob;
        }

        if (audioBlob) {
          try {
            const uploadedSong = await cloudApi.uploadSongToCloud(song, audioBlob);
            if (uploadedSong) {
              await db.saveSong({
                ...song,
                driveFileId: uploadedSong.driveFileId,
                streamUrl: uploadedSong.streamUrl,
              });
            }
          } catch (e) {
            console.error('Failed to upload song to cloud:', song.title, e);
          }
        }
      }

      await refreshSongs();
      setMigrationSuccess(true);
    } catch (err: any) {
      alert('Terjadi kesalahan saat migrasi: ' + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const copyScriptCode = async () => {
    try {
      const res = await fetch('/google-apps-script/Code.gs');
      let text = '';
      if (res.ok) {
        text = await res.text();
      } else {
        text = `// Silakan copy file Code.gs dari repository https://github.com/roqueforti/personal-mp3/blob/main/google-apps-script/Code.gs`;
      }
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      alert('Buka file google-apps-script/Code.gs di project untuk menyalin kodenya.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Sinkronisasi Multi-Device (Cloud)</h3>
              <p className="text-xs text-slate-500 font-medium">Google Drive & Google Sheets via Apps Script</p>
            </div>
          </div>

          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Information Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Database className="w-4 h-4 text-slate-700" />
              <span>Gratis & Tanpa Batas Penyimpanan Server</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Hubungkan URL Google Apps Script kamu agar lagu yang ada di HP atau Laptop
              otomatis tersimpan di <strong>Google Drive pribadi kamu</strong> dan bisa diakses dari semua perangkat.
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Google Apps Script Web App URL:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-colors whitespace-nowrap"
              >
                {testStatus === 'testing' ? 'Mengetes...' : 'Tes Koneksi'}
              </button>
            </div>

            {/* Test Status Message */}
            {testStatus === 'success' && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{testMessage}</span>
              </div>
            )}
            {testStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs text-rose-600 font-bold mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* MIGRATION SECTION (Upload local songs to cloud) */}
          {localOnlySongs.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span>Upload {localOnlySongs.length} Lagu Lokal ke Cloud</span>
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Ada {localOnlySongs.length} lagu di perangkat ini yang belum tersimpan di Google Drive.
                  </p>
                </div>
              </div>

              {isMigrating ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="truncate">{migrationProgress.text}</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(migrationProgress.current / Math.max(1, migrationProgress.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : migrationSuccess ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-100 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Semua lagu berhasil di-upload ke Google Drive! Sekarang buka HP dan klik Sinkronkan.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMigrateLocalSongs}
                  disabled={!url.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  Unggah {localOnlySongs.length} Lagu ke Google Drive Sekarang
                </button>
              )}
            </div>
          )}

          {/* Instructions Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                Panduan 1 Menit: Cara Membuat Google Apps Script
              </span>
              <span>{showInstructions ? '▲' : '▼'}</span>
            </button>

            {showInstructions && (
              <div className="p-4 space-y-3 bg-white text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200">
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Buka{' '}
                    <a
                      href="https://script.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-bold underline inline-flex items-center gap-1"
                    >
                      script.google.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    lalu klik <strong>New Project</strong>.
                  </li>
                  <li>
                    Salin script lengkap backend dengan tombol di bawah:
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={copyScriptCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-black transition-colors"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedScript ? 'Kode Disalin!' : 'Salin Kode Backend Code.gs'}
                      </button>
                    </div>
                  </li>
                  <li>Hapus kode bawaan di editor, lalu <strong>Paste</strong> kode yang baru disalin.</li>
                  <li>
                    Klik <strong>Deploy</strong> (kanan atas) ➔ <strong>New deployment</strong> ➔ Pilih tipe ⚙️ <strong>Web app</strong>.
                  </li>
                  <li>
                    Atur:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li><strong>Execute as:</strong> Me (email Google Anda)</li>
                      <li><strong>Who has access:</strong> Anyone (Siapa saja)</li>
                    </ul>
                  </li>
                  <li>Klik <strong>Deploy</strong>, izinkan akses akun (Authorize), lalu copy <strong>Web App URL</strong> dan paste di kolom atas!</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => syncWithCloud()}
            disabled={isSyncing || !url}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsCloudModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
