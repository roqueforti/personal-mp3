'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as db from '@/lib/db';
import { Playlist } from '@/types/music';
import {
  X,
  ListMusic,
  Plus,
  Trash2,
  Check,
  FolderPlus,
  Music,
} from 'lucide-react';

export default function PlaylistModal() {
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    playlists,
    refreshPlaylists,
    selectedSongForPlaylist,
    setSelectedSongForPlaylist,
    setActiveFilter,
  } = useAudio();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isPlaylistModalOpen) return null;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newPlaylistName.trim(),
      songIds: selectedSongForPlaylist ? [selectedSongForPlaylist.id] : [],
      createdAt: Date.now(),
    };

    await db.savePlaylist(newPl);
    await refreshPlaylists();
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handleToggleSongInPlaylist = async (pl: Playlist) => {
    if (!selectedSongForPlaylist) return;

    const exists = pl.songIds.includes(selectedSongForPlaylist.id);
    let updatedSongIds: string[];

    if (exists) {
      updatedSongIds = pl.songIds.filter((id) => id !== selectedSongForPlaylist.id);
    } else {
      updatedSongIds = [...pl.songIds, selectedSongForPlaylist.id];
    }

    const updatedPl: Playlist = {
      ...pl,
      songIds: updatedSongIds,
    };

    await db.savePlaylist(updatedPl);
    await refreshPlaylists();
  };

  const handleDeletePlaylist = async (plId: string, name: string) => {
    if (confirm(`Hapus playlist "${name}"? Lagu-lagu di dalamnya tetap aman di vault.`)) {
      await db.deletePlaylist(plId);
      await refreshPlaylists();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {selectedSongForPlaylist ? 'Tambah ke Playlist' : 'Kelola Playlist'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedSongForPlaylist
                  ? `Lagu: ${selectedSongForPlaylist.title}`
                  : `${playlists.length} playlist tersimpan`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedSongForPlaylist(null);
              setIsPlaylistModalOpen(false);
            }}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Create New Playlist */}
          {isCreating ? (
            <form onSubmit={handleCreatePlaylist} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <input
                type="text"
                placeholder="Nama playlist (misal: Workout, Chill, Santai)..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold"
                >
                  Buat Playlist
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm font-bold text-slate-800 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Buat Playlist Baru
            </button>
          )}

          {/* Playlist items */}
          {playlists.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Belum ada playlist. Buat playlist baru di atas!
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((pl) => {
                const containsSong =
                  selectedSongForPlaylist && pl.songIds.includes(selectedSongForPlaylist.id);

                return (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    {/* Left details */}
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (selectedSongForPlaylist) {
                          handleToggleSongInPlaylist(pl);
                        } else {
                          setActiveFilter(pl.id);
                          setIsPlaylistModalOpen(false);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{pl.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{pl.songIds.length} lagu</p>
                      </div>
                    </div>

                    {/* Right action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedSongForPlaylist ? (
                        <button
                          onClick={() => handleToggleSongInPlaylist(pl)}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${
                            containsSong
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus Playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={() => {
              setSelectedSongForPlaylist(null);
              setIsPlaylistModalOpen(false);
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
