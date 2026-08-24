'use client';

import React, { useState } from 'react';
import { Song } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import NativeConfirmModal from './NativeConfirmModal';
import {
  Heart,
  ListPlus,
  User,
  Download,
  Share2,
  Trash2,
  X,
  Music,
  Check,
} from 'lucide-react';

interface SongActionSheetProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArtist?: (artistName: string) => void;
}

export default function SongActionSheet({
  song,
  isOpen,
  onClose,
  onSelectArtist,
}: SongActionSheetProps) {
  const {
    toggleFavorite,
    setSelectedSongForPlaylist,
    setIsPlaylistModalOpen,
    deleteSong,
    downloadSongForOffline,
  } = useAudio();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen || !song) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleShare = async () => {
    triggerHaptic(10);
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Mendengarkan ${song.title} oleh ${song.artist} di SonicVault`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${song.title} - ${song.artist}`);
      setCopiedToast(true);
      setTimeout(() => {
        setCopiedToast(false);
        onClose();
      }, 1500);
      return;
    }
    onClose();
  };

  const handleDeleteConfirmed = () => {
    deleteSong(song.id);
    setIsDeleteModalOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 select-none animate-fade-in">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Sheet Container */}
        <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-slide-up space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Drag handle */}
          <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto" />

          {/* Song Mini Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
              {song.coverArt ? (
                <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">{song.title}</h4>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{song.artist}</p>
            </div>
          </div>

          {/* Toast Message when copied */}
          {copiedToast && (
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold text-center animate-scale-up">
              ✓ Info lagu disalin ke clipboard!
            </div>
          )}

          {/* Options List */}
          <div className="space-y-1 text-sm font-semibold text-slate-800">
            {/* Favorite */}
            <button
              onClick={() => {
                triggerHaptic(15);
                toggleFavorite(song.id);
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 active:scale-[0.98] flex items-center gap-3 transition-transform"
            >
              <Heart className={`w-4 h-4 ${song.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-600'}`} />
              <span>{song.favorite ? 'Hapus dari Lagu Disukai' : 'Tambah ke Lagu Disukai'}</span>
            </button>

            {/* Add to playlist */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setSelectedSongForPlaylist(song);
                setIsPlaylistModalOpen(true);
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 active:scale-[0.98] flex items-center gap-3 transition-transform"
            >
              <ListPlus className="w-4 h-4 text-slate-600" />
              <span>Tambah ke Playlist</span>
            </button>

            {/* Go to artist */}
            {onSelectArtist && (
              <button
                onClick={() => {
                  triggerHaptic(10);
                  onSelectArtist(song.artist);
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 active:scale-[0.98] flex items-center gap-3 transition-transform"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Lihat Profil Artis: {song.artist}</span>
              </button>
            )}

            {/* Download for offline */}
            {song.driveFileId && (
              <button
                onClick={async () => {
                  triggerHaptic(10);
                  await downloadSongForOffline(song);
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 active:scale-[0.98] flex items-center gap-3 transition-transform"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{song.blob ? 'Unduh Ulang ke Memori HP' : 'Unduh ke Memori HP (Offline Play)'}</span>
              </button>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 active:scale-[0.98] flex items-center gap-3 transition-transform"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Bagikan Musik</span>
            </button>

            {/* Delete (Opens Native Confirm Modal) */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setIsDeleteModalOpen(true);
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-600 active:scale-[0.98] flex items-center gap-3 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Lagu dari Vault</span>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={() => {
              triggerHaptic(5);
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-900 font-bold text-xs transition-transform text-center"
          >
            Batal
          </button>
        </div>
      </div>

      {/* Sleek Native Confirmation Modal */}
      <NativeConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Lagu dari Vault?"
        message={`Lagu "${song.title}" akan dihapus dari perpustakaan lokal perangkat Anda.`}
        confirmText="Hapus Lagu"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
