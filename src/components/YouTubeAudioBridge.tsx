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

  // Load YouTube IFrame API script once
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

      playerRef.current = new window.YT.Player('youtube-audio-bridge-container', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            isReadyRef.current = true;
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(Math.round(volume * 100));
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              if (repeatMode === 'one') {
                if (playerRef.current) {
                  playerRef.current.seekTo(0);
                  playerRef.current.playVideo();
                }
              } else {
                playNext();
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

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
      // Pause YouTube player if active when switching to non-YouTube song
      if (playerRef.current && isReadyRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      currentVideoIdRef.current = null;
      return;
    }

    if (videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = videoId;
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.loadVideoById({
            videoId,
            startSeconds: 0,
          });
          if (isPlaying) {
            playerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('YouTube load video note:', e);
        }
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
        const time = playerRef.current.getCurrentTime();
        if (Number.isFinite(time)) {
          window.dispatchEvent(new CustomEvent('yt-timeupdate', { detail: { currentTime: time } }));
        }
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
      id="youtube-audio-bridge-container"
      className="hidden pointer-events-none absolute -left-[9999px] -top-[9999px]"
      aria-hidden="true"
    />
  );
}
