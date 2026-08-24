'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';
import { formatTime } from '@/lib/formatters';
import { generateSynthwaveDemo, generateLofiDemo } from '@/lib/demoTracks';
import * as db from '@/lib/db';
import PopularArtists from './PopularArtists';
import FeaturedCards from './FeaturedCards';
import SongActionSheet from './SongActionSheet';
import ArtistDetailModal from './ArtistDetailModal';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Music,
  Disc3,
  Sparkles,
  Upload,
  Search,
  ListMusic,
  Disc,
  CheckCircle2,
  Cloud,
  Loader2,
} from 'lucide-react';

interface SongListProps {
  currentTab?: 'home' | 'search' | 'library' | 'cloud';
}

export default function SongList({ currentTab = 'home' }: SongListProps) {
  const {
    songs,
    filteredSongs,
    currentSong,
    isPlaying,
    isCaching,
    cachingSongId,
    playSong,
    togglePlay,
    setIsUploadOpen,
    setIsFullPlayerOpen,
    setIsCloudModalOpen,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    refreshSongs,
  } = useAudio();

  const [selectedActionSong, setSelectedActionSong] = useState<Song | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'playlists' | 'albums' | 'songs' | 'favorites'>('all');

  const handleLoadDemoSongs = async () => {
    setIsGeneratingDemo(true);
    try {
      const track1 = generateSynthwaveDemo();
      const track2 = generateLofiDemo();
      await db.saveSongsBatch([track1, track2]);
      await refreshSongs();
    } catch (e) {
      console.error('Failed to load demo tracks:', e);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (!isPlaying) {
        togglePlay();
      } else {
        setIsFullPlayerOpen(true);
      }
    } else {
      playSong(song, filteredSongs);
    }
  };

  // Compute songs based on activeTabFilter
  const displaySongs = React.useMemo(() => {
    if (activeTabFilter === 'favorites') {
      return filteredSongs.filter((s) => s.favorite);
    }
    return filteredSongs;
  }, [filteredSongs, activeTabFilter]);

  return (
    <div className="max-w-md mx-auto px-4 pt-2 pb-[calc(12rem+env(safe-area-inset-bottom,0px))] space-y-5">
      {/* Empty State */}
      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
            <Disc3 className="w-10 h-10 text-slate-800 animate-spin-slow" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Vault Masih Kosong</h3>
          <p className="text-slate-500 text-xs max-w-xs mb-6 leading-relaxed">
            Upload file MP3 favoritmu dari HP atau laptop. Musik tersimpan aman di Google Drive & HP kamu untuk diputar offline!
          </p>
          <div className="flex flex-col w-full gap-2.5">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-transform active:scale-95 shadow-md"
            >
              <Upload className="w-4 h-4" />
              Upload Lagu MP3
            </button>
            <button
              onClick={handleLoadDemoSongs}
              disabled={isGeneratingDemo}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {isGeneratingDemo ? 'Membuat Demo Audio...' : 'Coba 2 Musik Demo'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: Popular Artists (Horizontal Circular Avatars) */}
          <PopularArtists onSelectArtist={(name) => setSelectedArtistName(name)} />

          {/* SECTION 2: Category Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex gap-5 text-xs font-bold text-slate-400">
              <button
                onClick={() => setActiveTabFilter('all')}
                className={`transition-colors relative pb-2 -mb-2.5 ${
                  activeTabFilter === 'all'
                    ? 'text-slate-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900'
                    : 'hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTabFilter('favorites')}
                className={`transition-colors relative pb-2 -mb-2.5 ${
                  activeTabFilter === 'favorites'
                    ? 'text-slate-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900'
                    : 'hover:text-slate-700'
                }`}
              >
                Favorites
              </button>
              <button
                onClick={() => setActiveTabFilter('playlists')}
                className={`transition-colors relative pb-2 -mb-2.5 ${
                  activeTabFilter === 'playlists'
                    ? 'text-slate-900 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900'
                    : 'hover:text-slate-700'
                }`}
              >
                Playlists
              </button>
            </div>

            <span className="text-[11px] font-bold text-slate-400">
              {displaySongs.length} lagu
            </span>
          </div>

          {/* SECTION 3: Featured Playlists / Mood Cards */}
          <FeaturedCards onSelectCategory={(cat) => setSearchQuery(cat.toLowerCase().split(' ')[0])} />

          {/* SECTION 4: Top Tracks List (Numbered Rows) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Top weekly</h3>
              <span className="text-xs font-bold text-slate-400">Semua lagu</span>
            </div>

            <div className="space-y-1">
              {displaySongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const rankNumber = idx + 1;

                return (
                  <div
                    key={song.id}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all select-none ${
                      isCurrent
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Rank & Details */}
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleSongClick(song)}
                    >
                      {/* Rank Number */}
                      <span className={`w-4 text-center text-xs font-black flex-shrink-0 ${
                        rankNumber <= 3 ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {rankNumber}
                      </span>

                      {/* Cover Thumbnail */}
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0 flex items-center justify-center shadow-xs">
                        {song.coverArt ? (
                          <img
                            src={song.coverArt}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <Music className="w-5 h-5 text-slate-400" />
                          </div>
                        )}

                        {/* Active Playing Animation */}
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-1 bg-white rounded-full animate-bounce h-2.5" />
                              <span className="w-1 bg-white rounded-full animate-bounce delay-100 h-3.5" />
                              <span className="w-1 bg-white rounded-full animate-bounce delay-200 h-2" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title & Artist & Streaming / Offline Badge */}
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className={`text-xs font-extrabold truncate leading-snug ${
                          isCurrent ? 'text-slate-900' : 'text-slate-800'
                        }`}>
                          {song.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            {song.artist}
                          </p>
                          {song.blob ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50/90 px-1 py-0.2 rounded flex-shrink-0" title="Tersimpan di HP (Bisa Putar Offline)">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              Offline
                            </span>
                          ) : isCaching && cachingSongId === song.id ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-bold bg-amber-50/90 px-1 py-0.2 rounded flex-shrink-0 animate-pulse" title="Sedang streaming & mengunduh ke offline">
                              <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
                              Menyimpan...
                            </span>
                          ) : song.driveFileId ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-medium flex-shrink-0" title="Cloud Stream dari Google Drive">
                              <Cloud className="w-2.5 h-2.5 text-slate-400" />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Duration & Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {formatTime(song.duration)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActionSong(song);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Song Action Sheet (iOS Native Style) */}
      <SongActionSheet
        song={selectedActionSong}
        isOpen={Boolean(selectedActionSong)}
        onClose={() => setSelectedActionSong(null)}
        onSelectArtist={(name) => {
          setSelectedActionSong(null);
          setSelectedArtistName(name);
        }}
      />

      {/* Dedicated Artist Page */}
      <ArtistDetailModal
        artistName={selectedArtistName}
        onClose={() => setSelectedArtistName(null)}
        onOpenSongAction={(song) => setSelectedActionSong(song)}
      />
    </div>
  );
}
