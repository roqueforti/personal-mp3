'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { User, Music } from 'lucide-react';

interface PopularArtistsProps {
  onSelectArtist: (artist: string) => void;
}

const GRADIENT_COLORS = [
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
  'from-indigo-400 to-blue-600',
  'from-purple-400 to-indigo-600',
  'from-cyan-400 to-blue-600',
];

export default function PopularArtists({ onSelectArtist }: PopularArtistsProps) {
  const { songs } = useAudio();

  // Extract unique artists and their cover arts
  const artistsMap = React.useMemo(() => {
    const map = new Map<string, { count: number; coverArt?: string }>();
    songs.forEach((s) => {
      const art = s.artist?.trim() || 'Unknown Artist';
      const existing = map.get(art) || { count: 0 };
      map.set(art, {
        count: existing.count + 1,
        coverArt: existing.coverArt || s.coverArt,
      });
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [songs]);

  if (artistsMap.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Popular artists</h3>
        <span className="text-xs font-bold text-slate-400">{artistsMap.length} artis</span>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {artistsMap.map((artist, idx) => {
          const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
          return (
            <button
              key={artist.name}
              onClick={() => onSelectArtist(artist.name)}
              className="flex flex-col items-center flex-shrink-0 w-20 group text-center focus:outline-none"
            >
              {/* Circular Avatar */}
              <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-slate-200 to-slate-300 group-hover:scale-105 transition-transform shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                  {artist.coverArt ? (
                    <img
                      src={artist.coverArt}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg`}>
                      {artist.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Name */}
              <span className="text-xs font-bold text-slate-800 mt-2 truncate w-full group-hover:text-slate-900">
                {artist.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate w-full">
                {artist.count} lagu
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
