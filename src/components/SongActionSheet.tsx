'use client';

import React from 'react';
import { Song } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
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

  if (!isOpen || !song) return null;

  const handleShare = async () => {
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
      alert('Info lagu disalin ke clipboard!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />

        {/* Song Mini Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
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

        {/* Options List */}
        <div className="space-y-1 text-sm font-semibold text-slate-800">
          {/* Favorite */}
          <button
            onClick={() => {
              toggleFavorite(song.id);
              onClose();
            }}
            className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 transition-colors"
          >
            <Heart className={`w-4 h-4 ${song.favorite ? 'fill-slate-900 text-slate-900' : 'text-slate-600'}`} />
            <span>{song.favorite ? 'Hapus dari Lagu Disukai' : 'Tambah ke Lagu Disukai'}</span>
          </button>

          {/* Add to playlist */}
          <button
            onClick={() => {
              setSelectedSongForPlaylist(song);
              setIsPlaylistModalOpen(true);
              onClose();
            }}
            className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 transition-colors"
          >
            <ListPlus className="w-4 h-4 text-slate-600" />
            <span>Tambah ke Playlist</span>
          </button>

          {/* Go to artist */}
          {onSelectArtist && (
            <button
              onClick={() => {
                onSelectArtist(song.artist);
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 transition-colors"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>Lihat Artis: {song.artist}</span>
            </button>
          )}

          {/* Download for offline */}
          {song.driveFileId && (
            <button
              onClick={async () => {
                const ok = await downloadSongForOffline(song);
                if (ok) {
                  alert(`Lagu "${song.title}" berhasil diunduh untuk offline play!`);
                }
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{song.blob ? 'Unduh Ulang ke Memori HP' : 'Unduh ke Memori HP (Offline Play)'}</span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full px-4 py-3 rounded-2xl hover:bg-slate-100 flex items-center gap-3 transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span>Bagikan Musik</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm(`Hapus "${song.title}" dari vault?`)) {
                deleteSong(song.id);
              }
              onClose();
            }}
            className="w-full px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-600 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Lagu</span>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm transition-colors text-center"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
