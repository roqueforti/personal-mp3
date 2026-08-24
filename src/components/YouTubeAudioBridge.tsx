'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function YouTubeAudioBridge() {
  const {
    currentSong,
    isPlaying,
    volume,
    playbackRate,
    repeatMode,
    playNext,
  } = useAudio();

  const playerRef = useRef<any>(null);
  const isReadyRef = useRef<boolean>(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  // Load YouTube IFrame API script reliably
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
      if (playerRef.current) return;
      const targetElem = document.getElementById('youtube-audio-bridge-target');
      if (!targetElem) return;

      try {
        playerRef.current = new window.YT.Player('youtube-audio-bridge-target', {
          height: '200',
          width: '200',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              isReadyRef.current = true;
              console.log('YouTube Audio Bridge Ready!');
              if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(Math.round(volume * 100));
              }

              // If a song was already selected before player was ready, load and play it now
              if (currentVideoIdRef.current) {
                try {
                  playerRef.current.loadVideoById({
                    videoId: currentVideoIdRef.current,
                    startSeconds: 0,
                  });
                  playerRef.current.playVideo();
                } catch (err) {
                  console.warn('Deferred YouTube load note:', err);
                }
              }
            },
            onStateChange: (event: any) => {
              // 0: ENDED
              if (event.data === 0) {
                if (repeatModeRef.current === 'one') {
                  if (playerRef.current) {
                    playerRef.current.seekTo(0);
                    playerRef.current.playVideo();
                  }
                } else {
                  playNext();
                }
              }
            },
            onError: (e: any) => {
              console.warn('YouTube Player Event Error:', e.data);
            },
          },
        });
      } catch (err) {
        console.error('Failed to instantiate YouTube Player:', err);
      }
    };

    const checkAndInit = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        setTimeout(checkAndInit, 150);
      }
    };

    checkAndInit();

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, []);

  // Handle currentSong changes (YouTube track vs Native track)
  useEffect(() => {
    const videoId = currentSong?.youtubeVideoId;

    if (!videoId) {
      if (playerRef.current && isReadyRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      currentVideoIdRef.current = null;
      return;
    }

    currentVideoIdRef.current = videoId;

    if (playerRef.current && isReadyRef.current) {
      try {
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: 0,
        });
        playerRef.current.playVideo();
      } catch (e) {
        console.warn('YouTube load video note:', e);
      }
    }
  }, [currentSong?.id, currentSong?.youtubeVideoId]);

  // Sync Play / Pause state
  useEffect(() => {
    if (!currentSong?.youtubeVideoId || !playerRef.current || !isReadyRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn('YouTube play/pause sync note:', e);
    }
  }, [isPlaying, currentSong?.youtubeVideoId]);

  // Periodic time updates for YouTube tracks
  useEffect(() => {
    if (!currentSong?.youtubeVideoId || !isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current && isReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (Number.isFinite(time)) {
            window.dispatchEvent(new CustomEvent('yt-timeupdate', { detail: { currentTime: time } }));
          }
        } catch {}
      }
    }, 250);

    return () => clearInterval(interval);
  }, [currentSong?.youtubeVideoId, isPlaying]);

  // Listen to seek events from UI
  useEffect(() => {
    const handleSeek = (e: any) => {
      const sec = e.detail?.seconds;
      if (typeof sec === 'number' && playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.seekTo(sec, true);
        } catch {}
      }
    };

    window.addEventListener('yt-seek', handleSeek);
    return () => window.removeEventListener('yt-seek', handleSeek);
  }, []);

  // Sync Volume
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      if (typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(Math.round(volume * 100));
      }
    } catch {}
  }, [volume]);

  // Sync Playback Rate
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      if (typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(playbackRate);
      }
    } catch {}
  }, [playbackRate]);

  return (
    <div
      aria-hidden="true"
      className="fixed -bottom-[400px] -right-[400px] w-[200px] h-[200px] opacity-0 pointer-events-none z-[-1] overflow-hidden"
    >
      <div id="youtube-audio-bridge-target" />
    </div>
  );
}
