'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import SongList from '@/components/SongList';
import MiniPlayer from '@/components/MiniPlayer';
import NowPlayingModal from '@/components/NowPlayingModal';
import UploadModal from '@/components/UploadModal';
import EqualizerModal from '@/components/EqualizerModal';
import SleepTimerModal from '@/components/SleepTimerModal';
import PlaylistModal from '@/components/PlaylistModal';
import CloudSettingsModal from '@/components/CloudSettingsModal';
import MusicStudioModal from '@/components/MusicStudioModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import PWAUpdateToast from '@/components/PWAUpdateToast';
import BottomNav from '@/components/BottomNav';
import { useAudio } from '@/context/AudioContext';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'library' | 'cloud'>('home');
  const { setIsPlaylistModalOpen, setIsCloudModalOpen, setSearchQuery } = useAudio();

  const handleTabChange = (tab: 'home' | 'search' | 'library' | 'cloud') => {
    setCurrentTab(tab);
    if (tab === 'library') {
      setIsPlaylistModalOpen(true);
    } else if (tab === 'cloud') {
      setIsCloudModalOpen(true);
    } else if (tab === 'home') {
      setSearchQuery('');
    }
  };

  return (
    <main className="min-h-screen bg-background text-slate-900 flex flex-col relative selection:bg-slate-900 selection:text-white max-w-lg mx-auto bg-white border-x border-slate-100 shadow-xs">
      {/* Top Native Mobile Header */}
      <Navbar />

      {/* PWA Auto Update Notification Toast */}
      <PWAUpdateToast />

      {/* Main Content Area */}
      <section className="flex-1 w-full overflow-x-hidden">
        <div className="max-w-md mx-auto px-4 pt-2.5">
          <PWAInstallBanner />
        </div>
        <SongList currentTab={currentTab} />
      </section>

      {/* Floating Mini Player (Above Bottom Nav) */}
      <MiniPlayer />

      {/* Native Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Modals & Full Player */}
      <NowPlayingModal />
      <UploadModal />
      <EqualizerModal />
      <SleepTimerModal />
      <PlaylistModal />
      <CloudSettingsModal />
      <MusicStudioModal />
    </main>
  );
}
