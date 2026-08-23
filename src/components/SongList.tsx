'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';
import { formatTime } from '@/lib/formatters';
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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
          <Disc3 className="w-10 h-10 text-slate-800 animate-spin-slow" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Vault Musik Masih Kosong</h3>
        <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
          Upload file MP3 favorit kamu langsung dari HP atau laptop. Musik tersimpan aman di browser,
          bisa diputar offline dan di lock screen!
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm transition-transform active:scale-95 shadow-md w-full sm:w-auto justify-center"
          >
            <Upload className="w-4 h-4" />
            Upload File MP3
          </button>
          <button
            onClick={handleLoadDemoSongs}
            disabled={isGeneratingDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm transition-all w-full sm:w-auto justify-center shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            {isGeneratingDemo ? 'Membuat Demo Audio...' : 'Coba 2 Musik Demo'}
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-36">
      <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
        <span>Daftar Musik ({filteredSongs.length})</span>
        <span>Durasi</span>
      </div>

      <div className="space-y-2">
        {filteredSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id;
          const isMenuOpen = menuOpenId === song.id;

          return (
            <div
              key={song.id}
              className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all select-none ${
                isCurrent
                  ? 'bg-slate-100 border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              {/* Left Section: Cover & Details */}
              <div
                className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => handleSongClick(song)}
              >
                {/* Cover Thumbnail */}
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                  {song.coverArt ? (
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <Music className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
                    </div>
                  )}

                  {/* Play / Active Animation Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-white rounded-full animate-bounce h-3" />
                        <span className="w-1 bg-white rounded-full animate-bounce delay-100 h-4" />
                        <span className="w-1 bg-white rounded-full animate-bounce delay-200 h-2" />
                      </div>
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Track Title & Artist */}
                <div className="min-w-0 flex-1 pr-2">
                  <h4
                    className={`text-sm font-bold truncate leading-snug ${
                      isCurrent ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'
                    }`}
                  >
                    {song.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {song.artist} <span className="opacity-40">•</span> {song.album}
                  </p>
                </div>
              </div>

              {/* Right Section: Time & Actions */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Duration */}
                <span className="text-xs text-slate-500 font-semibold font-mono hidden sm:inline-block w-12 text-right">
                  {formatTime(song.duration)}
                </span>

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  title={song.favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      song.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-600'
                    }`}
                  />
                </button>

                {/* Context Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(isMenuOpen ? null : song.id);
                    }}
                    className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 text-xs font-semibold text-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSongForPlaylist(song);
                            setIsPlaylistModalOpen(true);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-100 text-slate-800"
                        >
                          <ListPlus className="w-4 h-4 text-slate-600" />
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
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-rose-50 text-rose-600"
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
