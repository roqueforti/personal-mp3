'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import DesktopHeader from '@/components/DesktopHeader';
import DesktopBottomPlayer from '@/components/DesktopBottomPlayer';
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
import BackgroundPlaybackModal from '@/components/BackgroundPlaybackModal';
import AMOLEDBlackScreenOverlay from '@/components/AMOLEDBlackScreenOverlay';
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col md:flex-row relative selection:bg-slate-900 selection:text-white">
      {/* 1. Left Desktop Sidebar (Spotify Web style - hidden on mobile) */}
      <DesktopSidebar currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* 2. Main Fluid Content Container */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen bg-white md:bg-slate-50/40">
        {/* Mobile Top Navbar (< md) */}
        <div className="md:hidden">
          <Navbar />
        </div>

        {/* Desktop Top Header (>= md) */}
        <DesktopHeader />

        {/* PWA Auto Update Notification Toast */}
        <PWAUpdateToast />

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          <SongList currentTab={currentTab} />
        </main>
      </div>

      {/* 3. Mobile Floating Mini Player (< md) */}
      <div className="md:hidden">
        <MiniPlayer />
      </div>

      {/* 4. Mobile Bottom Navigation Bar (< md) */}
      <div className="md:hidden">
        <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />
      </div>

      {/* 5. Desktop Full-Featured Bottom Player Bar (>= md - Spotify Web style) */}
      <DesktopBottomPlayer />

      {/* Modals & Audio Components */}
      <NowPlayingModal />
      <EqualizerModal />
      <SleepTimerModal />
      <PlaylistModal />
      <CloudSettingsModal />
      <MusicStudioModal />
      <YouTubeSearchModal />
      <YouTubeAudioBridge />
      <BackgroundPlaybackModal />
      <AMOLEDBlackScreenOverlay />
    </div>
  );
}
