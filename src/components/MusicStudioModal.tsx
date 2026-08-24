'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Music2,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowLeft,
  Play,
  Pause,
  Cloud,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCheck,
  Search,
  HardDrive,
  RefreshCw,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  FileAudio,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';
import * as supabase from '@/lib/supabase';
import { formatFileSize, formatTime } from '@/lib/formatters';

interface StagedUpload {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  coverArtBlob: Blob | null;
  coverArtPreview: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMsg?: string;
}

export default function MusicStudioModal() {
  const {
    isStudioOpen,
    setIsStudioOpen,
    songs,
    setSongs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    syncFromCloud,
    clearAllLocalSongs,
    isSyncing,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'config'>('upload');
  const [stagedFiles, setStagedFiles] = useState<StagedUpload[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Library Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isStudioOpen) {
      setSupabaseUrl(supabase.getSupabaseUrl());
      setSupabaseKey(supabase.getSupabaseAnonKey());
      setIsConfigured(supabase.isSupabaseConfigured());
      setTestResult(null);
    }
  }, [isStudioOpen]);

  if (!isStudioOpen) return null;

  // Extract Metadata & Duration from Audio File
  const processAudioFile = async (file: File): Promise<StagedUpload> => {
    let title = file.name.replace(/\.[^/.]+$/, '');
    let artist = 'Unknown Artist';
    let album = 'SonicVault';
    let duration = 0;
    let coverArtPreview = '';
    let coverArtBlob: Blob | null = null;

    // Detect Title & Artist from standard format "Artist - Title.mp3"
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    // Get Audio Duration via HTMLAudioElement
    try {
      const objectUrl = URL.createObjectURL(file);
      const tempAudio = new Audio();
      tempAudio.src = objectUrl;

      await new Promise<void>((resolve) => {
        tempAudio.onloadedmetadata = () => {
          if (Number.isFinite(tempAudio.duration)) {
            duration = Math.round(tempAudio.duration);
          }
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        tempAudio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
      });
    } catch (e) {
      console.warn('Could not read audio duration:', e);
    }

    return {
      id: 'staged_' + Math.random().toString(36).substring(2, 9),
      file,
      title,
      artist,
      album,
      genre: 'Pop',
      duration,
      coverArtBlob,
      coverArtPreview,
      status: 'idle',
      progress: 0,
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const audioFiles = Array.from(files).filter((f) =>
      f.type.startsWith('audio/') || /\.(mp3|m4a|flac|wav|ogg|aac)$/i.test(f.name)
    );

    const newStaged: StagedUpload[] = [];
    for (const file of audioFiles) {
      const staged = await processAudioFile(file);
      newStaged.push(staged);
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSingle = async (staged: StagedUpload) => {
    if (!isConfigured) {
      setActiveTab('config');
      alert('Silakan hubungkan Supabase terlebih dahulu di tab Konfigurasi Supabase.');
      return;
    }

    setStagedFiles((prev) =>
      prev.map((s) => (s.id === staged.id ? { ...s, status: 'uploading', progress: 30 } : s))
    );

    try {
      // 1. Upload audio file to Supabase Storage
      const audioResult = await supabase.uploadAudioToSupabase(staged.file, staged.file.name);
      if (!audioResult) throw new Error('Gagal mengunggah file audio ke Supabase Storage');

      setStagedFiles((prev) =>
        prev.map((s) => (s.id === staged.id ? { ...s, progress: 70 } : s))
      );

      // 2. Upload cover art if provided
      let coverArtUrl = '';
      if (staged.coverArtBlob) {
        const cUrl = await supabase.uploadCoverArtToSupabase(staged.coverArtBlob, staged.id);
        if (cUrl) coverArtUrl = cUrl;
      }

      // 3. Save song record in Supabase Database
      const newSong: Song = {
        id: 'sb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: staged.title.trim() || 'Untitled',
        artist: staged.artist.trim() || 'Unknown Artist',
        album: staged.album.trim() || 'SonicVault',
        genre: staged.genre,
        duration: staged.duration,
        fileSize: audioResult.size,
        mimeType: staged.file.type || 'audio/mpeg',
        streamUrl: audioResult.url,
        coverArt: coverArtUrl || staged.coverArtPreview || '',
        blob: staged.file, // also keep locally
        dateAdded: Date.now(),
        playCount: 0,
        favorite: false,
      };

      const saved = await supabase.saveSongToSupabase(newSong);
      if (!saved) throw new Error('Gagal menyimpan metadata lagu ke database Supabase');

      setStagedFiles((prev) =>
        prev.map((s) => (s.id === staged.id ? { ...s, status: 'success', progress: 100 } : s))
      );

      // Add to local state & indexedDB
      setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
    } catch (err: any) {
      setStagedFiles((prev) =>
        prev.map((s) =>
          s.id === staged.id ? { ...s, status: 'error', errorMsg: err.message || 'Upload gagal' } : s
        )
      );
    }
  };

  const handleUploadAll = async () => {
    if (!isConfigured) {
      setActiveTab('config');
      alert('Silakan hubungkan Supabase terlebih dahulu di tab Konfigurasi Supabase.');
      return;
    }

    const idleFiles = stagedFiles.filter((s) => s.status === 'idle' || s.status === 'error');
    if (idleFiles.length === 0) return;

    setIsUploadingAll(true);
    for (const staged of idleFiles) {
      await handleUploadSingle(staged);
    }
    setIsUploadingAll(false);
  };

  const handleSaveConfig = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Mohon isi Supabase Project URL dan Anon Key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    supabase.setSupabaseConfig(supabaseUrl, supabaseKey);
    const result = await supabase.pingSupabase(supabaseUrl, supabaseKey);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      setIsConfigured(true);
      syncFromCloud();
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabase.SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDeleteCloudSong = async (song: Song) => {
    if (!confirm(`Hapus lagu "${song.title}" dari Supabase Storage & Database?`)) return;

    setDeletingSongId(song.id);
    await supabase.deleteSongFromSupabase(song);
    setSongs((prev) => prev.filter((s) => s.id !== song.id));
    setDeletingSongId(null);
  };

  const handleSaveSongEdit = async () => {
    if (!editingSong) return;
    setIsSavingEdit(true);

    try {
      await supabase.saveSongToSupabase(editingSong);
      setSongs((prev) => prev.map((s) => (s.id === editingSong.id ? editingSong : s)));
      setEditingSong(null);
    } catch (e) {
      alert('Gagal memperbarui metadata lagu.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredLibrary = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-right duration-200 select-none max-w-lg mx-auto border-x border-slate-100 shadow-2xl">
      {/* Top Native Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStudioOpen(false)}
            className="p-2 -ml-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>Music Studio</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cloud
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              Upload, edit & kelola database Supabase
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsStudioOpen(false)}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Navigation Tabs (Fully Responsive Grid on Mobile) */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 px-2 pt-2 gap-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl text-xs font-bold transition-all truncate ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Upload ({stagedFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl text-xs font-bold transition-all truncate ${
              activeTab === 'library'
                ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Koleksi ({songs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-t-xl text-xs font-bold transition-all truncate ${
              activeTab === 'config'
                ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Setup</span>
            {isConfigured && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: UPLOAD LAGU */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-3xl p-6 text-center cursor-pointer transition-all bg-slate-50 hover:bg-slate-100/70 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.flac,.wav,.ogg"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-slate-900" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Pilih atau Tarik File MP3 / M4A / FLAC ke Sini
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Mendukung upload banyak file sekaligus. File otomatis di-stream via Supabase CDN dan siap diputar instan!
                </p>
              </div>

              {/* Upload List & Batch Actions */}
              {stagedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Siap Diunggah ({stagedFiles.length} Lagu)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStagedFiles([])}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 px-2 py-1"
                      >
                        Bersihkan
                      </button>
                      <button
                        onClick={handleUploadAll}
                        disabled={isUploadingAll}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                      >
                        {isUploadingAll ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Semua ke Supabase</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {stagedFiles.map((staged) => (
                      <div
                        key={staged.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* File Art / Icon */}
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {staged.coverArtPreview ? (
                              <img
                                src={staged.coverArtPreview}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileAudio className="w-6 h-6 text-slate-600" />
                            )}
                          </div>

                          {/* Editable Inputs */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={staged.title}
                              onChange={(e) =>
                                setStagedFiles((prev) =>
                                  prev.map((s) =>
                                    s.id === staged.id ? { ...s, title: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="Judul Lagu"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                            />
                            <input
                              type="text"
                              value={staged.artist}
                              onChange={(e) =>
                                setStagedFiles((prev) =>
                                  prev.map((s) =>
                                    s.id === staged.id ? { ...s, artist: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="Nama Artis / Penyanyi"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800"
                            />
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {staged.status === 'success' ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                                Terupload
                              </span>
                            ) : staged.status === 'uploading' ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                {staged.progress}%
                              </span>
                            ) : (
                              <button
                                onClick={() => handleUploadSingle(staged)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
                              >
                                Upload
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setStagedFiles((prev) => prev.filter((s) => s.id !== staged.id))
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {staged.errorMsg && (
                          <div className="text-[11px] font-medium text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{staged.errorMsg}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KOLEKSI CLOUD LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Sync Row */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari lagu di cloud..."
                    className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  onClick={syncFromCloud}
                  disabled={isSyncing}
                  className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Sinkronisasi dengan Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Hapus semua lagu lama dari memori HP lokal dan sinkronkan hanya dari Supabase?')) {
                      await clearAllLocalSongs();
                      await syncFromCloud();
                    }
                  }}
                  className="px-3 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Bersihkan semua cache lagu lama dari memori lokal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Cache</span>
                </button>
              </div>

              {/* Table / List of Songs */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                {filteredLibrary.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    Belum ada lagu di cloud. Upload file MP3 di tab &ldquo;Upload Lagu&rdquo;.
                  </div>
                ) : (
                  filteredLibrary.map((song, idx) => (
                    <div
                      key={song.id}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-slate-400 w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {song.coverArt ? (
                            <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {song.artist} • {formatFileSize(song.fileSize)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Play Preview */}
                        <button
                          onClick={() => playSong(song)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition-colors"
                          title="Putar Preview"
                        >
                          {currentSong?.id === song.id && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>

                        {/* Edit Metadata */}
                        <button
                          onClick={() => setEditingSong(song)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Info Lagu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteCloudSong(song)}
                          disabled={deletingSongId === song.id}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                          title="Hapus dari Cloud"
                        >
                          {deletingSongId === song.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SETUP SUPABASE */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Petunjuk 3 Langkah Setup Supabase (Gratis)
                </h4>
                <ol className="text-xs space-y-1.5 list-decimal list-inside text-emerald-900 font-medium">
                  <li>
                    Buka{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-emerald-700"
                    >
                      supabase.com
                    </a>{' '}
                    dan buat Project baru (Gratis).
                  </li>
                  <li>
                    Di Dashboard Supabase, buka menu <strong>SQL Editor</strong>, klik{' '}
                    <strong>+ New Query</strong>, tempelkan SQL Setup di bawah, lalu klik <strong>RUN</strong>.
                  </li>
                  <li>
                    Buka <strong>Project Settings → API</strong>, salin <strong>Project URL</strong> dan{' '}
                    <strong>anon / public API Key</strong> ke form di bawah ini.
                  </li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCheck className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveConfig}
                  disabled={isTesting}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Simpan & Tes Koneksi Supabase</span>
                </button>
              </div>

              {/* SQL Schema 1-Click Copy Box */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-600" />
                    SQL Setup Script (Tabel songs, playlists & Storage Bucket)
                  </span>
                  <button
                    onClick={copySqlToClipboard}
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
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-44 border border-slate-800 scrollbar-none">
                  {supabase.SUPABASE_SQL_SETUP}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Edit Song Details */}
        {editingSong && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Edit Metadata Lagu</h3>
                <button
                  onClick={() => setEditingSong(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Lagu</label>
                  <input
                    type="text"
                    value={editingSong.title}
                    onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Artis / Penyanyi</label>
                  <input
                    type="text"
                    value={editingSong.artist}
                    onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Album</label>
                  <input
                    type="text"
                    value={editingSong.album}
                    onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cover Art URL</label>
                  <input
                    type="url"
                    value={editingSong.coverArt || ''}
                    onChange={(e) => setEditingSong({ ...editingSong, coverArt: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setEditingSong(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSongEdit}
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
