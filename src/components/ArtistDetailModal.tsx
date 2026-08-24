'use client';

import React from 'react';
import { Song } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import {
  ChevronLeft,
  MoreVertical,
  Play,
  Pause,
  ChevronRight,
  Music,
  Heart,
  Shuffle,
} from 'lucide-react';
import { formatTime } from '@/lib/formatters';

interface ArtistDetailModalProps {
  artistName: string | null;
  onClose: () => void;
  onOpenSongAction: (song: Song) => void;
}

export default function ArtistDetailModal({
  artistName,
  onClose,
  onOpenSongAction,
}: ArtistDetailModalProps) {
  const { songs, currentSong, isPlaying, playSong, togglePlay } = useAudio();
  const [isFollowing, setIsFollowing] = React.useState(false);

  if (!artistName) return null;

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const artistSongs = songs.filter(
    (s) => s.artist.toLowerCase().trim() === artistName.toLowerCase().trim()
  );

  const topSong = artistSongs[0];
  const uniqueAlbums = Array.from(new Set(artistSongs.map((s) => s.album || 'Single')));

  const handlePlayAll = () => {
    if (artistSongs.length > 0) {
      triggerHaptic(15);
      playSong(artistSongs[0], artistSongs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-slide-up select-none pt-[env(safe-area-inset-top,0px)] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto border-x border-slate-100 shadow-2xl">
      {/* Top Navigation Bar with Safe Area */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <button
          onClick={() => {
            triggerHaptic(5);
            onClose();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-90 text-slate-800 transition-all"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Artist Profile</h2>

        <button
          onClick={() => {
            if (topSong) {
              triggerHaptic(5);
              onOpenSongAction(topSong);
            }
          }}
          className="p-2 -mr-2 rounded-full hover:bg-slate-100 active:scale-90 text-slate-800 transition-all"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {/* Artist Profile Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Big Circular Avatar */}
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 shadow-xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {topSong?.coverArt ? (
                <img
                  src={topSong.coverArt}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">
                  {artistName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name & Stats */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{artistName}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {artistSongs.length} lagu di perpustakaan kamu
            </p>
          </div>

          {/* Action Buttons: FOLLOW & PLAY ALL */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                triggerHaptic(10);
                setIsFollowing(!isFollowing);
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-95 ${
                isFollowing
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-900'
              }`}
            >
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </button>

            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-transform active:scale-95 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              PLAY ALL
            </button>
          </div>
        </div>

        {/* Popular Songs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Popular songs</h3>
            <span className="text-xs font-bold text-slate-400">{artistSongs.length} track</span>
          </div>

          <div className="space-y-1">
            {artistSongs.map((song) => {
              const isCur = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => {
                    triggerHaptic(10);
                    playSong(song, artistSongs);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                    isCur ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                      {song.coverArt ? (
                        <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isCur ? 'text-slate-900' : 'text-slate-800'}`}>
                        {song.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{song.album || 'Single'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {formatTime(song.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(5);
                        onOpenSongAction(song);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 active:scale-90 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Albums Section */}
        {uniqueAlbums.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight px-1">Albums</h3>
            <div className="grid grid-cols-2 gap-3">
              {uniqueAlbums.map((albumName) => (
                <div
                  key={albumName}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 cursor-pointer hover:bg-slate-100 active:scale-[0.98] transition-all"
                >
                  <div className="aspect-square rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                    {topSong?.coverArt ? (
                      <img src={topSong.coverArt} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate">{albumName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">SonicVault Audio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
