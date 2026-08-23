'use client';

import React from 'react';
import { Home, Search, Library, Cloud, Upload } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

interface BottomNavProps {
  currentTab: 'home' | 'search' | 'library' | 'cloud';
  setCurrentTab: (tab: 'home' | 'search' | 'library' | 'cloud') => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const { setIsUploadOpen, isCloudConnected } = useAudio();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-4 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {/* Home */}
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentTab === 'home' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setCurrentTab('search')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentTab === 'search' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1">Search</span>
        </button>

        {/* Upload Center Floating Action Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          title="Upload MP3"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 text-white shadow-md hover:bg-black active:scale-95 transition-all -mt-3 border-2 border-white"
        >
          <Upload className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Library */}
        <button
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentTab === 'library' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Library className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1">Library</span>
        </button>

        {/* Cloud Multi-Device */}
        <button
          onClick={() => setCurrentTab('cloud')}
          className={`relative flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentTab === 'cloud' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Cloud className={`w-5 h-5 ${currentTab === 'cloud' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1">Cloud</span>
          {isCloudConnected && (
            <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          )}
        </button>
      </div>
    </nav>
  );
}
