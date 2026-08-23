'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Sparkles, Disc, Flame, Headphones, Moon, Radio } from 'lucide-react';

interface FeaturedCardsProps {
  onSelectCategory?: (category: string) => void;
}

const FEATURED_ITEMS = [
  {
    id: 'lofi',
    title: 'Lo-Fi Beats',
    subtitle: 'Relax & Chill',
    gradient: 'from-pink-500 via-rose-500 to-amber-500',
    icon: Moon,
  },
  {
    id: 'deepfocus',
    title: 'Deep Focus',
    subtitle: 'Study & Flow',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    icon: Headphones,
  },
  {
    id: 'party',
    title: 'Party Hits',
    subtitle: 'High Energy',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    icon: Flame,
  },
  {
    id: 'workout',
    title: 'Workout',
    subtitle: 'Bass & Power',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    icon: Disc,
  },
];

export default function FeaturedCards({ onSelectCategory }: FeaturedCardsProps) {
  const { setSearchQuery } = useAudio();

  const handleCardClick = (title: string) => {
    if (onSelectCategory) {
      onSelectCategory(title);
    } else {
      setSearchQuery(title.toLowerCase().split(' ')[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* 2-Column Grid (or horizontal on small devices) */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURED_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.title)}
              className={`relative h-28 sm:h-32 rounded-3xl p-4 overflow-hidden bg-gradient-to-br ${item.gradient} text-white shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between select-none`}
            >
              {/* Top icon */}
              <div className="flex justify-between items-start">
                <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Title & subtitle */}
              <div>
                <h4 className="text-sm font-black tracking-tight leading-tight">{item.title}</h4>
                <p className="text-[10px] text-white/80 font-medium">{item.subtitle}</p>
              </div>

              {/* Decorative radial blur in background */}
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/20 rounded-full blur-xl pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
