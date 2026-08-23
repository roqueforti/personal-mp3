'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import SongList from '@/components/SongList';
import MiniPlayer from '@/components/MiniPlayer';
import NowPlayingModal from '@/components/NowPlayingModal';
import UploadModal from '@/components/UploadModal';
import EqualizerModal from '@/components/EqualizerModal';
import SleepTimerModal from '@/components/SleepTimerModal';
import PlaylistModal from '@/components/PlaylistModal';
import CloudSettingsModal from '@/components/CloudSettingsModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import PWAUpdateToast from '@/components/PWAUpdateToast';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 flex flex-col relative selection:bg-slate-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* PWA Mobile Install Banner */}
      <PWAInstallBanner />

      {/* PWA Auto Update Notification Toast */}
      <PWAUpdateToast />

      {/* Main Track List Container */}
      <section className="flex-1 w-full">
        <SongList />
      </section>

      {/* Sticky Bottom Mini Player */}
      <MiniPlayer />

      {/* Modals & Full Player */}
      <NowPlayingModal />
      <UploadModal />
      <EqualizerModal />
      <SleepTimerModal />
      <PlaylistModal />
      <CloudSettingsModal />
    </main>
  );
}
