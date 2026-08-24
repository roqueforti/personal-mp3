'use client';

import React, { useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import * as db from '@/lib/db';
import { Playlist } from '@/types/music';
import NativeConfirmModal from './NativeConfirmModal';
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
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: string; name: string } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (!isPlaylistModalOpen) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
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
      setIsPlaylistModalOpen(false);
      setSelectedSongForPlaylist(null);
    }
    setDragOffset(0);
    touchStartRef.current = null;
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    triggerHaptic(15);
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
    triggerHaptic(10);

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

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    triggerHaptic(15);
    await db.deletePlaylist(playlistToDelete.id);
    await refreshPlaylists();
    setPlaylistToDelete(null);
  };

  return (
    <>
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsPlaylistModalOpen(false);
                setSelectedSongForPlaylist(null);
              }}
              className="p-2 -ml-2 rounded-full text-slate-800 hover:bg-slate-200/50 active:scale-90 transition-transform"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-2xs">
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
              triggerHaptic(5);
              setIsPlaylistModalOpen(false);
              setSelectedSongForPlaylist(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 active:scale-90 transition-transform"
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
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-scale-up"
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 active:scale-95 transition-transform"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black active:scale-95 shadow-xs transition-transform"
                >
                  Buat Playlist
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                triggerHaptic(5);
                setIsCreating(true);
              }}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] flex items-center justify-center gap-2 text-slate-700 font-bold text-xs transition-all"
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
                      triggerHaptic(10);
                      setActiveFilter(`pl_${pl.id}`);
                      setIsPlaylistModalOpen(false);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                    isSongInPlaylist
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
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
                          triggerHaptic(10);
                          setPlaylistToDelete({ id: pl.id, name: pl.name });
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 active:scale-90 transition-all"
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

      {/* Sleek Native Confirmation Modal for Playlist Delete */}
      <NativeConfirmModal
        isOpen={Boolean(playlistToDelete)}
        title="Hapus Playlist?"
        message={`Playlist "${playlistToDelete?.name}" akan dihapus. Lagu-lagu di dalamnya tetap tersimpan aman di vault.`}
        confirmText="Hapus Playlist"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDeletePlaylist}
        onCancel={() => setPlaylistToDelete(null)}
      />
    </>
  );
}
