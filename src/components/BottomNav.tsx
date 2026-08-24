'use client';

import React from 'react';
import { Home, Search, Library, Layers, Upload, Database } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

interface BottomNavProps {
  currentTab: 'home' | 'search' | 'library' | 'studio';
  setCurrentTab: (tab: 'home' | 'search' | 'library' | 'studio') => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const { isCloudConnected, setIsStudioOpen } = useAudio();

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleTabClick = (tab: 'home' | 'search' | 'library' | 'studio') => {
    triggerHaptic(8);
    setCurrentTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-[env(safe-area-inset-bottom,0px)] shadow-lg select-none max-w-lg mx-auto">
      <div className="flex items-center justify-around h-14 px-2">
        {/* Home Tab */}
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center w-14 h-full active:scale-90 transition-transform ${
            currentTab === 'home' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Search & Discover Tab */}
        <button
          onClick={() => handleTabClick('search')}
          className={`flex flex-col items-center justify-center w-14 h-full active:scale-90 transition-transform ${
            currentTab === 'search' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        {/* Center Floating Action Studio/Upload Button */}
        <button
          onClick={() => {
            triggerHaptic(12);
            setIsStudioOpen(true);
          }}
          title="Music Studio (Upload & Sync)"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 text-white shadow-md hover:bg-black active:scale-90 transition-transform -mt-3.5 border-2 border-white"
        >
          <Upload className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Library Tab */}
        <button
          onClick={() => handleTabClick('library')}
          className={`flex flex-col items-center justify-center w-14 h-full active:scale-90 transition-transform ${
            currentTab === 'library' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Library className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Library</span>
        </button>

        {/* Music Studio / Cloud Tab */}
        <button
          onClick={() => handleTabClick('studio')}
          className={`relative flex flex-col items-center justify-center w-14 h-full active:scale-90 transition-transform ${
            currentTab === 'studio' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Database className={`w-5 h-5 ${currentTab === 'studio' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Cloud</span>
          {isCloudConnected && (
            <span className="absolute top-2 right-3.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          )}
        </button>
      </div>
    </nav>
  );
}
