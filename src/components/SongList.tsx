'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';
import { formatTime, formatFileSize } from '@/lib/formatters';
import { generateSynthwaveDemo, generateLofiDemo } from '@/lib/demoTracks';
import * as db from '@/lib/db';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Trash2,
  ListPlus,
  Music,
  Disc3,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function SongList() {
  const {
    filteredSongs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleFavorite,
    deleteSong,
    setIsUploadOpen,
    setSelectedSongForPlaylist,
    setIsPlaylistModalOpen,
    setIsFullPlayerOpen,
    refreshSongs,
  } = useAudio();

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

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

  if (filteredSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-surface-raised border border-border flex items-center justify-center mb-5 text-primary shadow-xl">
          <Disc3 className="w-10 h-10 animate-spin-slow text-primary-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Vault Musik Masih Kosong</h3>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          Upload file MP3 favorit kamu langsung dari HP atau laptop. Musik tersimpan aman di browser,
          bisa diputar offline dan di lock screen!
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-600 text-white font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/30 w-full sm:w-auto justify-center"
          >
            <Upload className="w-4 h-4" />
            Upload File MP3
          </button>
          <button
            onClick={handleLoadDemoSongs}
            disabled={isGeneratingDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-raised hover:bg-surface-active border border-border text-slate-200 hover:text-white font-semibold text-sm transition-all w-full sm:w-auto justify-center"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {isGeneratingDemo ? 'Membuat Demo Audio...' : 'Coba 2 Musik Demo'}
          </button>
        </div>
      </div>
    );
  }

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      // Toggle play or open full player
      if (!isPlaying) {
        togglePlay();
      } else {
        setIsFullPlayerOpen(true);
      }
    } else {
      playSong(song, filteredSongs);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-36">
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
        <span>Daftar Musik ({filteredSongs.length})</span>
        <span>Durasi</span>
      </div>

      <div className="space-y-1.5">
        {filteredSongs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          const isMenuOpen = menuOpenId === song.id;

          return (
            <div
              key={song.id}
              className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all select-none ${
                isCurrent
                  ? 'bg-surface-active border-primary/50 shadow-md'
                  : 'bg-surface hover:bg-surface-raised border-border'
              }`}
            >
              {/* Left Section: Cover & Details */}
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => handleSongClick(song)}
              >
                {/* Cover Thumbnail */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-raised border border-border flex-shrink-0 flex items-center justify-center shadow-sm">
                  {song.coverArt ? (
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-indigo-950 flex items-center justify-center">
                      <Music className="w-5 h-5 text-slate-400 group-hover:text-primary-300" />
                    </div>
                  )}

                  {/* Play / Active Animation Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-primary-400 rounded-full animate-bounce h-3" />
                        <span className="w-1 bg-primary-400 rounded-full animate-bounce delay-100 h-4" />
                        <span className="w-1 bg-primary-400 rounded-full animate-bounce delay-200 h-2" />
                      </div>
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white" />
                    )}
                  </div>
                </div>

                {/* Track Title & Artist */}
                <div className="min-w-0 flex-1 pr-2">
                  <h4
                    className={`text-sm font-semibold truncate leading-snug ${
                      isCurrent ? 'text-primary-400' : 'text-slate-100 group-hover:text-white'
                    }`}
                  >
                    {song.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {song.artist} <span className="opacity-40">•</span> {song.album}
                  </p>
                </div>
              </div>

              {/* Right Section: Time & Actions */}
              <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                {/* Duration */}
                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block w-12 text-right">
                  {formatTime(song.duration)}
                </span>

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  title={song.favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                  className={`p-2 rounded-xl transition-colors ${
                    song.favorite
                      ? 'text-rose-500 hover:text-rose-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${song.favorite ? 'fill-rose-500' : ''}`} />
                </button>

                {/* Context Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(isMenuOpen ? null : song.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-raised transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-surface-raised border border-border shadow-2xl z-50 py-1.5 text-xs text-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSongForPlaylist(song);
                            setIsPlaylistModalOpen(true);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-surface-active text-slate-200 hover:text-white"
                        >
                          <ListPlus className="w-4 h-4 text-primary-400" />
                          Tambah ke Playlist
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus lagu "${song.title}" dari vault?`)) {
                              deleteSong(song.id);
                            }
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus Lagu
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
