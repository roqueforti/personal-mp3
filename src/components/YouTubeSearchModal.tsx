'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';
import * as supabase from '@/lib/supabase';
import * as db from '@/lib/db';
import {
  Search,
  ArrowLeft,
  X,
  Play,
  Pause,
  Cloud,
  Check,
  Loader2,
  Sparkles,
  Youtube,
  Music,
  TrendingUp,
  Key,
  ExternalLink,
} from 'lucide-react';

interface YouTubeSearchResult {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  streamUrl?: string;
  source: 'youtube' | 'itunes';
  viewCountText?: string;
}

const YT_KEY_STORAGE = 'sonicvault_yt_api_key';
const DEFAULT_YOUTUBE_API_KEY = 'AIzaSyB9jgibwq-8yHjBwZIcs85b-iJ_TCNnyfQ';

const TRENDING_SEARCHES = [
  'Top Hits Indonesia',
  'Radiohead',
  'Tulus',
  'Nadhif Basalamah',
  'Lofi Chill Beats',
  'Attack on Titan OST',
  'Acoustic Pop',
  'Sheila On 7',
];

export default function YouTubeSearchModal() {
  const {
    isYouTubeSearchOpen,
    setIsYouTubeSearchOpen,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    refreshSongs,
  } = useAudio();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingSongId, setSavingSongId] = useState<string | null>(null);
  const [savedSongIds, setSavedSongIds] = useState<Set<string>>(new Set());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState(DEFAULT_YOUTUBE_API_KEY);
  const [hasOfficialYT, setHasOfficialYT] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved API Key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(YT_KEY_STORAGE) || DEFAULT_YOUTUBE_API_KEY;
      setSavedApiKey(storedKey);
      setApiKeyInput(storedKey);
    }
  }, []);

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  useEffect(() => {
    if (isYouTubeSearchOpen && results.length === 0 && !query) {
      handleSearch('Top Hits Indonesia');
    }
  }, [isYouTubeSearchOpen]);

  if (!isYouTubeSearchOpen) return null;

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem(YT_KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(YT_KEY_STORAGE);
      }
      setSavedApiKey(trimmed);
      setShowKeyConfig(false);
      handleSearch(query || 'Top Hits Indonesia');
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (savedApiKey) {
        headers['x-youtube-api-key'] = savedApiKey;
      }

      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        setHasOfficialYT(Boolean(data.hasYouTubeOfficial));
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        handleSearch(val);
      }, 400);
    }
  };

  const handlePlayYouTubeTrack = async (item: YouTubeSearchResult) => {
    let directStreamUrl = item.streamUrl;

    // If streamUrl not already present, resolve direct audio stream
    if (!directStreamUrl && item.videoId) {
      try {
        const res = await fetch(
          `/api/youtube/stream?videoId=${item.videoId}&title=${encodeURIComponent(
            item.title
          )}&artist=${encodeURIComponent(item.artist)}`
        );
        const data = await res.json();
        if (data.success && data.streamUrl) {
          directStreamUrl = data.streamUrl;
        }
      } catch {}
    }

    const song: Song = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album || 'Online Music',
      duration: item.duration,
      fileSize: 0,
      mimeType: directStreamUrl ? 'audio/mp4' : (item.source === 'youtube' ? 'audio/youtube' : 'audio/mp4'),
      coverArt: item.thumbnail,
      youtubeVideoId: directStreamUrl ? undefined : item.videoId,
      streamUrl: directStreamUrl,
      dateAdded: Date.now(),
      playCount: 0,
    };

    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handleSaveToVault = async (item: YouTubeSearchResult) => {
    setSavingSongId(item.id);
    try {
      let directStreamUrl = item.streamUrl;
      if (!directStreamUrl && item.videoId) {
        try {
          const res = await fetch(
            `/api/youtube/stream?videoId=${item.videoId}&title=${encodeURIComponent(
              item.title
            )}&artist=${encodeURIComponent(item.artist)}`
          );
          const data = await res.json();
          if (data.success && data.streamUrl) {
            directStreamUrl = data.streamUrl;
          }
        } catch {}
      }

      let audioBlob: Blob | undefined = undefined;
      if (directStreamUrl) {
        try {
          const res = await fetch(directStreamUrl);
          if (res.ok) {
            const b = await res.blob();
            if (b && b.size > 1000) {
              audioBlob = b;
            }
          }
        } catch {}
      }

      const song: Song = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.album || 'Online Music',
        duration: item.duration,
        fileSize: audioBlob ? audioBlob.size : 0,
        mimeType: directStreamUrl ? 'audio/mp4' : (item.source === 'youtube' ? 'audio/youtube' : 'audio/mp4'),
        coverArt: item.thumbnail,
        blob: audioBlob,
        youtubeVideoId: directStreamUrl ? undefined : item.videoId,
        streamUrl:
          directStreamUrl || (item.videoId ? `https://www.youtube.com/watch?v=${item.videoId}` : ''),
        dateAdded: Date.now(),
        playCount: 0,
      };

      // 1. Save locally to IndexedDB
      await db.saveSong(song);

      // 2. Save to Supabase PostgreSQL database
      if (supabase.isSupabaseConfigured()) {
        await supabase.saveSongToSupabase(song);
      }

      setSavedSongIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      await refreshSongs();
    } catch (e) {
      console.error('Save to vault error:', e);
    } finally {
      setSavingSongId(null);
    }
  };

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
      setIsYouTubeSearchOpen(false);
    }
    setDragOffset(0);
    touchStartRef.current = null;
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
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsYouTubeSearchOpen(false)}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-100 active:scale-90 transition-transform"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shadow-2xs">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Cari Musik Online</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                Live
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Jutaan lagu YouTube & katalog global
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className={`p-2 rounded-full active:scale-90 transition-transform ${
              showKeyConfig || savedApiKey
                ? 'text-red-600 bg-red-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Pengaturan API Key"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsYouTubeSearchOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional YouTube API Key Setup Drawer */}
      {showKeyConfig && (
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/60 space-y-2 animate-fade-in flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              YouTube Data API v3 Key
            </span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>Ambil Key Gratis</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2 pt-1">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & Chips */}
      <div className="p-4 border-b border-slate-100 bg-white space-y-3 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Ketik judul lagu, penyanyi, anime OST, atau lirik..."
            autoFocus
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Trending Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar py-0.5 text-xs w-full">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            Tren:
          </span>
          {TRENDING_SEARCHES.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                handleSearch(tag);
              }}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap text-[11px] transition-colors flex-shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results List (Takes 100% full screen height) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
            <p className="text-xs font-semibold">Mencari lagu online...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 text-center">
            <Music className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada hasil ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Coba cari dengan kata kunci lain atau pilih rekomendasi tren di atas.
            </p>
          </div>
        ) : (
          results.map((item) => {
            const isCurrent =
              (item.videoId && currentSong?.youtubeVideoId === item.videoId) ||
              currentSong?.id === item.id;
            const isSaved = savedSongIds.has(item.id);
            const isSaving = savingSongId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                  isCurrent
                    ? 'bg-red-50/70 border-red-200 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-100 shadow-2xs'
                }`}
              >
                {/* Left: Thumbnail & Info */}
                <div
                  onClick={() => handlePlayYouTubeTrack(item)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/80 group">
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white text-[9px] font-mono font-bold">
                      {item.durationFormatted}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                        {item.title}
                      </h4>
                      {item.source === 'youtube' ? (
                        <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-extrabold flex-shrink-0">
                          YT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-extrabold flex-shrink-0">
                          HD
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                      {item.artist}
                    </p>
                    {item.viewCountText && (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {item.viewCountText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayYouTubeTrack(item)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isCurrent && isPlaying
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                    title={isCurrent && isPlaying ? 'Pause' : 'Putar Musik'}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Save to Vault Button */}
                  <button
                    onClick={() => handleSaveToVault(item)}
                    disabled={isSaved || isSaving}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSaved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 hover:bg-black text-white shadow-xs disabled:opacity-50'
                    }`}
                    title="Simpan ke Koleksi & Supabase"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersimpan</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
