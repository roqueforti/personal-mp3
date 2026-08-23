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

      // 2. If Cloud Apps Script is configured, upload to Google Drive in background
      if (cloudApi.isCloudConfigured()) {
        setProgressText('Mengunggah ke Google Drive & Cloud Database...');
        for (let i = 0; i < parsedSongs.length; i++) {
          const song = parsedSongs[i];
          const fileBlob = selectedFiles[i] || song.blob;
          if (fileBlob) {
            setProgressText(`Mengunggah (${i + 1}/${parsedSongs.length}): ${song.title}...`);
            try {
              const cloudSong = await cloudApi.uploadSongToCloud(song, fileBlob);
              if (cloudSong) {
                // Update local song with cloud driveFileId & streamUrl
                await db.saveSong({ ...song, driveFileId: cloudSong.driveFileId, streamUrl: cloudSong.streamUrl });
              }
            } catch (err) {
              console.warn('Cloud upload skipped or failed for song:', song.title, err);
            }
          }
        }
        await refreshSongs();
      }

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Upload Lagu ke Vault</h3>
              <p className="text-xs text-slate-500 font-medium">Bebas upload, tersimpan offline di HP/Laptop</p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center mb-3 text-slate-700">
              <FileAudio className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              Pilih file MP3 atau Tarik ke Sini
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Mendukung MP3, M4A, FLAC, WAV, OGG (Bisa pilih banyak sekaligus)
            </p>
          </div>

          {/* Progress text */}
          {(isProcessing || isSaving) && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="truncate">{progressText}</span>
            </div>
          )}

          {/* Preview Parsed Songs List */}
          {parsedSongs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Siap Ditambahkan ({parsedSongs.length})</span>
                <span>Total: {formatFileSize(parsedSongs.reduce((acc, s) => acc + s.fileSize, 0))}</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {parsedSongs.map((song, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {song.coverArt ? (
                          <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{song.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {formatTime(song.duration)}
                      </span>
                      <button
                        onClick={() => removeParsedSong(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <HardDrive className="w-4 h-4 text-slate-700 flex-shrink-0" />
            <span>
              Penyimpanan Browser: <strong>{formatFileSize(storageInfo.usedBytes)}</strong> terpakai
              (Bebas kuota server, privasi 100% aman di perangkatmu).
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedFiles([]);
              setParsedSongs([]);
              setIsUploadOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-sm font-semibold transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSaveToVault}
            disabled={parsedSongs.length === 0 || isProcessing || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-sm"
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
