'use client';

import React, { useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { parseAudioFile } from '@/lib/id3Parser';
import * as db from '@/lib/db';
import * as cloudApi from '@/lib/cloudApi';
import { Song } from '@/types/music';
import { formatFileSize, formatTime } from '@/lib/formatters';
import {
  X,
  ArrowLeft,
  Upload,
  Music,
  CheckCircle2,
  FileAudio,
  Loader2,
  Trash2,
  HardDrive,
} from 'lucide-react';

export default function UploadModal() {
  const { isUploadOpen, setIsUploadOpen, refreshSongs, storageInfo } = useAudio();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedSongs, setParsedSongs] = useState<Song[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isUploadOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        f.name.endsWith('.mp3') ||
        f.name.endsWith('.wav') ||
        f.name.endsWith('.ogg') ||
        f.name.endsWith('.m4a') ||
        f.name.endsWith('.aac') ||
        f.name.endsWith('.flac')
    );

    if (fileArray.length === 0) {
      alert('Silakan pilih file audio (MP3, M4A, WAV, OGG, dll)');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...fileArray]);
    setIsProcessing(true);

    const newParsed: Song[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProgressText(`Membaca tag audio (${i + 1}/${fileArray.length}): ${file.name}`);
      try {
        const song = await parseAudioFile(file);
        newParsed.push(song);
      } catch (e) {
        console.error('Failed to parse file:', file.name, e);
      }
    }

    setParsedSongs((prev) => [...prev, ...newParsed]);
    setIsProcessing(false);
    setProgressText('');
  };

  const handleSaveToVault = async () => {
    if (parsedSongs.length === 0) return;

    setIsSaving(true);
    setProgressText('Menyimpan audio ke memori lokal...');

    try {
      // 1. Save locally to IndexedDB first
      await db.saveSongsBatch(parsedSongs);
      await refreshSongs();

      // 2. If Supabase is configured, upload in background
      if (cloudApi.isCloudConfigured()) {
        setProgressText('Mengunggah ke Supabase CDN & Database...');
        for (let i = 0; i < parsedSongs.length; i++) {
          const song = parsedSongs[i];
          const fileBlob = selectedFiles[i] || song.blob;
          if (fileBlob) {
            setProgressText(`Mengunggah (${i + 1}/${parsedSongs.length}): ${song.title}...`);
            try {
              const cloudSong = await cloudApi.uploadSongToCloud(song, fileBlob);
              if (cloudSong) {
                await db.saveSong({ ...song, streamUrl: cloudSong.streamUrl });
              }
            } catch (err) {
              console.warn('Cloud upload note for song:', song.title, err);
            }
          }
        }
      }

      await refreshSongs();
      setIsUploadOpen(false);
      setSelectedFiles([]);
      setParsedSongs([]);
    } catch (e) {
      console.error('Failed to save to vault:', e);
      alert('Gagal menyimpan beberapa lagu ke storage.');
    } finally {
      setIsSaving(false);
      setProgressText('');
    }
  };

  const handleRemoveSong = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setParsedSongs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-right duration-200 select-none max-w-lg mx-auto border-x border-slate-100 shadow-2xl">
      {/* Native Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(false)}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Upload Lagu ke Vault</h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">Simpan offline & sinkronkan ke Cloud</p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(false)}
          className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 pb-24">
        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-slate-900 bg-slate-100'
              : 'border-slate-300 hover:border-slate-900 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
              <FileAudio className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Klik untuk memilih atau seret file audio kemari
            </p>
            <p className="text-[11px] text-slate-500">
              Mendukung MP3, M4A, FLAC, WAV, AAC, OGG
            </p>
          </div>
        </div>

        {/* Progress Message */}
        {(isProcessing || isSaving) && (
          <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-800 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>{progressText || 'Sedang memproses file audio...'}</span>
          </div>
        )}

        {/* Staged File List */}
        {parsedSongs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>File Siap Disimpan ({parsedSongs.length})</span>
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setParsedSongs([]);
                }}
                className="text-rose-600 hover:underline"
              >
                Hapus Semua
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedSongs.map((song, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {song.coverArt ? (
                        <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate text-slate-900">{song.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {song.artist} • {formatTime(song.duration)} • {formatFileSize(song.fileSize)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveSong(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || isProcessing}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Simpan {parsedSongs.length} Lagu ke Vault</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
