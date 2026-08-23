import { Song } from '@/types/music';

interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekTo: (time: number) => void;
  onSeekBackward: (offset: number) => void;
  onSeekForward: (offset: number) => void;
}

export class MediaSessionController {
  private static instance: MediaSessionController;
  private isSupported: boolean;

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  public static getInstance(): MediaSessionController {
    if (!MediaSessionController.instance) {
      MediaSessionController.instance = new MediaSessionController();
    }
    return MediaSessionController.instance;
  }

  public updateMetadata(song: Song | null): void {
    if (!this.isSupported || !navigator.mediaSession) return;

    if (!song) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artworkList: MediaImage[] = song.coverArt
      ? [
          { src: song.coverArt, sizes: '96x96', type: 'image/jpeg' },
          { src: song.coverArt, sizes: '128x128', type: 'image/jpeg' },
          { src: song.coverArt, sizes: '192x192', type: 'image/jpeg' },
          { src: song.coverArt, sizes: '256x256', type: 'image/jpeg' },
          { src: song.coverArt, sizes: '384x384', type: 'image/jpeg' },
          { src: song.coverArt, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || 'Unknown Title',
      artist: song.artist || 'Unknown Artist',
      album: song.album || 'SonicVault',
      artwork: artworkList,
    });
  }

  public updatePlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported || !navigator.mediaSession) return;
    navigator.mediaSession.playbackState = state;
  }

  public updatePositionState(duration: number, position: number, playbackRate = 1): void {
    if (!this.isSupported || !navigator.mediaSession || typeof navigator.mediaSession.setPositionState !== 'function') {
      return;
    }

    if (Number.isFinite(duration) && Number.isFinite(position) && duration > 0 && position >= 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate,
          position: Math.min(Math.max(0, position), duration),
        });
      } catch (err) {
        // Silently catch invalid position state edge cases
      }
    }
  }

  public registerActionHandlers(callbacks: MediaSessionCallbacks): void {
    if (!this.isSupported || !navigator.mediaSession) return;

    const actionMap: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ['play', () => callbacks.onPlay()],
      ['pause', () => callbacks.onPause()],
      ['previoustrack', () => callbacks.onPrevious()],
      ['nexttrack', () => callbacks.onNext()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) {
            callbacks.onSeekTo(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          callbacks.onSeekBackward(details.seekOffset || 10);
        },
      ],
      [
        'seekforward',
        (details) => {
          callbacks.onSeekForward(details.seekOffset || 10);
        },
      ],
      ['stop', () => callbacks.onPause()],
    ];

    for (const [action, handler] of actionMap) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // Some browsers don't support every action, gracefully ignore
      }
    }
  }
}
