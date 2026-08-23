'use client';

import React, { useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { parseAudioFile } from '@/lib/id3Parser';
import * as db from '@/lib/db';
import { Song } from '@/types/music';
import { formatFileSize, formatTime } from '@/lib/formatters';
import {
  X,
  Upload,
  Music,
  CheckCircle2,
  AlertCircle,
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
    setProgressText('Menyimpan ke IndexedDB di HP/Browser...');

    try {
      await db.saveSongsBatch(parsedSongs);
      await refreshSongs();
      // Reset state and close modal
      setSelectedFiles([]);
      setParsedSongs([]);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan file audio:', err);
      alert('Gagal menyimpan audio ke database. Pastikan memori browser cukup.');
    } finally {
      setIsSaving(false);
      setProgressText('');
    }
  };

  const removeParsedSong = (index: number) => {
    setParsedSongs((prev) => prev.filter((_, i) => i !== index));
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Upload Lagu ke Vault</h3>
              <p className="text-xs text-slate-400">Bebas upload, tersimpan offline di HP/Laptop</p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary-400 hover:bg-surface-raised'
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
            <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border mx-auto flex items-center justify-center mb-3 text-primary-400">
              <FileAudio className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Pilih file MP3 atau Tarik File ke Sini
            </p>
            <p className="text-xs text-slate-400">
              Mendukung MP3, M4A, FLAC, WAV, OGG (Bisa pilih banyak sekaligus)
            </p>
          </div>

          {/* Progress / Status text */}
          {(isProcessing || isSaving) && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary-300 text-xs">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="truncate">{progressText}</span>
            </div>
          )}

          {/* Preview Parsed Songs List */}
          {parsedSongs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                <span>Siap Ditambahkan ({parsedSongs.length})</span>
                <span>
                  Total: {formatFileSize(parsedSongs.reduce((acc, s) => acc + s.fileSize, 0))}
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {parsedSongs.map((song, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-surface border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {song.coverArt ? (
                          <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-mono text-slate-400">
                        {formatTime(song.duration)}
                      </span>
                      <button
                        onClick={() => removeParsedSong(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storage Information */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-raised border border-border text-xs text-slate-400">
            <HardDrive className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              Penyimpanan Browser: <strong>{formatFileSize(storageInfo.usedBytes)}</strong> terpakai
              (Bebas kuota server, privasi 100% aman di perangkatmu).
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedFiles([]);
              setParsedSongs([]);
              setIsUploadOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface text-slate-300 text-sm font-medium transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSaveToVault}
            disabled={parsedSongs.length === 0 || isProcessing || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-md shadow-primary/25"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Simpan {parsedSongs.length > 0 ? `(${parsedSongs.length})` : ''} ke Vault
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
