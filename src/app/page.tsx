'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SongList from '@/components/SongList';
import MiniPlayer from '@/components/MiniPlayer';
import NowPlayingModal from '@/components/NowPlayingModal';
import EqualizerModal from '@/components/EqualizerModal';
import SleepTimerModal from '@/components/SleepTimerModal';
import PlaylistModal from '@/components/PlaylistModal';
import CloudSettingsModal from '@/components/CloudSettingsModal';
import MusicStudioModal from '@/components/MusicStudioModal';
import YouTubeSearchModal from '@/components/YouTubeSearchModal';
import YouTubeAudioBridge from '@/components/YouTubeAudioBridge';
import PWAUpdateToast from '@/components/PWAUpdateToast';
import BottomNav from '@/components/BottomNav';
import { useAudio } from '@/context/AudioContext';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'library' | 'studio'>('home');
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    isStudioOpen,
    setIsStudioOpen,
    isYouTubeSearchOpen,
    setIsYouTubeSearchOpen,
    setSearchQuery,
  } = useAudio();

  const handleTabChange = (tab: 'home' | 'search' | 'library' | 'studio') => {
    setCurrentTab(tab);
    if (tab === 'search') {
      setIsYouTubeSearchOpen(true);
    } else if (tab === 'library') {
      setIsPlaylistModalOpen(true);
    } else if (tab === 'studio') {
      setIsStudioOpen(true);
    } else if (tab === 'home') {
      setSearchQuery('');
    }
  };

  // Keep bottom tab in sync when modals close
  useEffect(() => {
    if (!isYouTubeSearchOpen && currentTab === 'search') {
      setCurrentTab('home');
    }
  }, [isYouTubeSearchOpen]);

  useEffect(() => {
    if (!isPlaylistModalOpen && currentTab === 'library') {
      setCurrentTab('home');
    }
  }, [isPlaylistModalOpen]);

  useEffect(() => {
    if (!isStudioOpen && currentTab === 'studio') {
      setCurrentTab('home');
    }
  }, [isStudioOpen]);

  return (
    <main className="min-h-screen bg-background text-slate-900 flex flex-col relative selection:bg-slate-900 selection:text-white max-w-lg mx-auto bg-white border-x border-slate-100 shadow-xs">
      {/* Top Native Mobile Header */}
      <Navbar />

      {/* PWA Auto Update Notification Toast */}
      <PWAUpdateToast />

      {/* Main Content Area */}
      <section className="flex-1 w-full overflow-x-hidden">
        <SongList currentTab={currentTab} />
      </section>

      {/* Floating Mini Player (Above Bottom Nav) */}
      <MiniPlayer />

      {/* Native Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Modals & Full Player */}
      <NowPlayingModal />
      <EqualizerModal />
      <SleepTimerModal />
      <PlaylistModal />
      <CloudSettingsModal />
      <MusicStudioModal />
      <YouTubeSearchModal />
      <YouTubeAudioBridge />
    </main>
  );
}
