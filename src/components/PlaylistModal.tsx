'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as db from '@/lib/db';
import { Playlist } from '@/types/music';
import {
  X,
  ArrowLeft,
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
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-right duration-200 select-none max-w-lg mx-auto border-x border-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaylistModalOpen(false);
              setSelectedSongForPlaylist(null);
            }}
            className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <ListMusic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {selectedSongForPlaylist ? 'Tambah ke Playlist' : 'Kelola Playlist'}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {selectedSongForPlaylist
                ? `Lagu: ${selectedSongForPlaylist.title}`
                : `${playlists.length} playlist tersimpan`}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsPlaylistModalOpen(false);
            setSelectedSongForPlaylist(null);
          }}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Playlist List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {/* Create New Playlist Form/Button */}
        {isCreating ? (
          <form
            onSubmit={handleCreatePlaylist}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
          >
            <label className="text-xs font-bold text-slate-700">Nama Playlist Baru</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Contoh: Lagu Kerja, Chill Sore, Akustik..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:outline-none text-xs font-semibold text-slate-900 bg-white"
            />
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black shadow-xs"
              >
                Buat Playlist
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-2 text-slate-700 font-bold text-xs transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Buat Playlist Baru</span>
          </button>
        )}

        {playlists.length === 0 && !isCreating ? (
          <div className="text-center py-16 text-slate-400">
            <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">Belum ada playlist</p>
            <p className="text-[11px] mt-0.5">Buat playlist pertama Anda di atas</p>
          </div>
        ) : (
          playlists.map((pl) => {
            const isSongInPlaylist =
              selectedSongForPlaylist && pl.songIds.includes(selectedSongForPlaylist.id);

            return (
              <div
                key={pl.id}
                onClick={() => {
                  if (selectedSongForPlaylist) {
                    handleToggleSongInPlaylist(pl);
                  } else {
                    setActiveFilter(`pl_${pl.id}`);
                    setIsPlaylistModalOpen(false);
                  }
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSongInPlaylist
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isSongInPlaylist
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ListMusic className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate leading-tight">{pl.name}</h4>
                    <p
                      className={`text-[11px] font-medium mt-0.5 ${
                        isSongInPlaylist ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {pl.songIds.length} Lagu
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {selectedSongForPlaylist ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSongInPlaylist ? 'bg-white text-slate-900' : 'border border-slate-300'
                      }`}
                    >
                      {isSongInPlaylist && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(pl.id, pl.name);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Hapus Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
