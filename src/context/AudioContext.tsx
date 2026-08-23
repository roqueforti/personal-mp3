'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Song,
  Playlist,
  RepeatMode,
  EqualizerPresetName,
  EqualizerPreset,
  SleepTimerState,
} from '@/types/music';
import * as db from '@/lib/db';
import { MediaSessionController } from '@/lib/mediaSession';

export const EQUALIZER_FREQUENCIES = [60, 230, 910, 3600, 14000];

export const EQUALIZER_PRESETS: Record<EqualizerPresetName, [number, number, number, number, number]> = {
  Flat: [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 1, 0, -1],
  'Bass Reducer': [-6, -4, -1, 0, 1],
  'Vocal Boost': [-2, 1, 4, 3, 0],
  'Treble Boost': [-1, 0, 1, 4, 6],
  Rock: [5, 3, -1, 2, 4],
  Pop: [-1, 2, 4, 2, -1],
  Electronic: [5, 4, 0, 2, 4],
  Acoustic: [3, 2, 1, 2, 3],
  Custom: [0, 0, 0, 0, 0],
};

interface AudioContextType {
  // Songs & Playlists
  songs: Song[];
  playlists: Playlist[];
  filteredSongs: Song[];
  refreshSongs: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  
  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string; // 'all' | 'favorites' | 'recent' | playlistId
  setActiveFilter: (filter: string) => void;

  // Playback state
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isLoadingAudio: boolean;
  queue: Song[];

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleFavorite: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;

  // Sleep Timer
  sleepTimer: SleepTimerState;
  startSleepTimer: (minutes: number, endOfTrack?: boolean) => void;
  cancelSleepTimer: () => void;

  // Equalizer
  eqPreset: EqualizerPresetName;
  eqGains: [number, number, number, number, number];
  setEqPreset: (name: EqualizerPresetName) => void;
  setEqGain: (index: number, gain: number) => void;
  analyserNode: AnalyserNode | null;

  // Modals & Sheets
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  isEqualizerOpen: boolean;
  setIsEqualizerOpen: (open: boolean) => void;
  isSleepTimerOpen: boolean;
  setIsSleepTimerOpen: (open: boolean) => void;
  selectedSongForPlaylist: Song | null;
  setSelectedSongForPlaylist: (song: Song | null) => void;

  // Storage stats
  storageInfo: { usedBytes: number; quotaBytes: number; percentage: number; isPersisted: boolean };
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modals
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);

  // Storage Stats
  const [storageInfo, setStorageInfo] = useState({ usedBytes: 0, quotaBytes: 0, percentage: 0, isPersisted: false });

  // Sleep Timer
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    minutesRemaining: 0,
    totalMinutes: 0,
    endOfTrack: false,
  });

  // Equalizer
  const [eqPreset, setEqPresetState] = useState<EqualizerPresetName>('Flat');
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);

  // Audio & Web Audio API references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Repeat and Shuffle references for stable callbacks
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const sleepTimerRef = useRef(sleepTimer);
  sleepTimerRef.current = sleepTimer;

  // Initialize Audio Element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    // Mobile optimization attributes for background playback
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      MediaSessionController.getInstance().updatePlaybackState('playing');
    };

    const onPause = () => {
      setIsPlaying(false);
      MediaSessionController.getInstance().updatePlaybackState('paused');
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      MediaSessionController.getInstance().updatePositionState(
        audio.duration || 0,
        audio.currentTime,
        audio.playbackRate
      );
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoadingAudio(false);
    };

    const onEnded = () => {
      // Check sleep timer end-of-track condition
      if (sleepTimerRef.current.active && sleepTimerRef.current.endOfTrack) {
        setSleepTimer({
          active: false,
          minutesRemaining: 0,
          totalMinutes: 0,
          endOfTrack: false,
        });
        audio.pause();
        return;
      }

      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }

      handleNextTrack();
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', () => setIsLoadingAudio(true));
    audio.addEventListener('playing', () => setIsLoadingAudio(false));

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Web Audio Equalizer Setup
  const initWebAudio = () => {
    if (audioContextRef.current || !audioRef.current || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // 5-band filters
      const filters = EQUALIZER_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.frequency.value = freq;
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === EQUALIZER_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.gain.value = eqGains[i] || 0;
        return filter;
      });
      filterNodesRef.current = filters;

      // Analyser for real-time visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserNodeRef.current = analyser;

      // Gain node for master control & fade out
      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      // Connect graph: source -> filters -> analyser -> gain -> destination
      let lastNode: AudioNode = source;
      for (const f of filters) {
        lastNode.connect(f);
        lastNode = f;
      }
      lastNode.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API initialization failed (may require user gesture)', e);
    }
  };

  // Load initial songs & playlists from IndexedDB
  const refreshSongs = async () => {
    try {
      const stored = await db.getAllSongs();
      setSongs(stored);
      updateStorageStats();
    } catch (err) {
      console.error('Error loading songs from IndexedDB:', err);
    }
  };

  const refreshPlaylists = async () => {
    try {
      const stored = await db.getAllPlaylists();
      setPlaylists(stored);
    } catch (err) {
      console.error('Error loading playlists from IndexedDB:', err);
    }
  };

  const updateStorageStats = async () => {
    const stats = await db.getStorageEstimate();
    setStorageInfo(stats);
  };

  useEffect(() => {
    refreshSongs();
    refreshPlaylists();
  }, []);

  // Filter & Search computation
  const filteredSongs = React.useMemo(() => {
    let result = [...songs];

    // Filter by category
    if (activeFilter === 'favorites') {
      result = result.filter((s) => s.favorite);
    } else if (activeFilter === 'recent') {
      result = result
        .filter((s) => (s.lastPlayed || 0) > 0)
        .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    } else if (activeFilter !== 'all') {
      // Must be a playlist ID
      const pl = playlists.find((p) => p.id === activeFilter);
      if (pl) {
        const idSet = new Set(pl.songIds);
        result = result.filter((s) => idSet.has(s.id));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
      );
    }

    return result;
  }, [songs, playlists, activeFilter, searchQuery]);

  // Master Play Function
  const playSong = useCallback(
    async (song: Song, newQueue?: Song[]) => {
      initWebAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!audioRef.current) return;

      const effectiveQueue = newQueue || (queueRef.current.length > 0 ? queueRef.current : songs);
      setQueue(effectiveQueue);
      if (!isShuffle) {
        setOriginalQueue(effectiveQueue);
      }

      setCurrentSong(song);
      setIsLoadingAudio(true);

      // Clean old object URL
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      let audioBlob = song.blob;
      // If blob is not attached in memory, retrieve full record from IndexedDB
      if (!audioBlob) {
        const full = await db.getSongById(song.id);
        audioBlob = full?.blob;
      }

      if (!audioBlob) {
        console.error('No audio blob found for song:', song.title);
        setIsLoadingAudio(false);
        return;
      }

      const objectUrl = URL.createObjectURL(audioBlob);
      activeBlobUrlRef.current = objectUrl;

      audioRef.current.src = objectUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        db.incrementPlayCount(song.id);
        MediaSessionController.getInstance().updateMetadata(song);
        MediaSessionController.getInstance().updatePlaybackState('playing');
      } catch (err) {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [songs, isShuffle, playbackRate, volume]
  );

  // Play Next
  const handleNextTrack = useCallback(() => {
    const currentList = queueRef.current;
    if (currentList.length === 0) return;

    const cur = currentSongRef.current;
    const curIdx = cur ? currentList.findIndex((s) => s.id === cur.id) : -1;

    let nextIdx = curIdx + 1;
    if (nextIdx >= currentList.length) {
      if (repeatModeRef.current === 'off') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        return;
      }
      nextIdx = 0; // Loop around in 'all' mode
    }

    playSong(currentList[nextIdx]);
  }, [playSong]);

  // Play Previous
  const handlePrevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // If played more than 3s, restart current song
      audioRef.current.currentTime = 0;
      return;
    }

    const currentList = queueRef.current;
    if (currentList.length === 0) return;

    const cur = currentSongRef.current;
    const curIdx = cur ? currentList.findIndex((s) => s.id === cur.id) : -1;

    let prevIdx = curIdx - 1;
    if (prevIdx < 0) {
      prevIdx = currentList.length - 1;
    }

    playSong(currentList[prevIdx]);
  }, [playSong]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audioRef.current.paused) {
      if (!currentSong && songs.length > 0) {
        playSong(songs[0]);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentSong, songs, playSong]);

  // Seek
  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    MediaSessionController.getInstance().updatePositionState(
      audioRef.current.duration || 0,
      seconds,
      audioRef.current.playbackRate
    );
  }, []);

  // Volume
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
    }
  }, []);

  // Playback Rate
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Shuffle Toggle
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle) {
        // Shuffle queue
        const cur = currentSongRef.current;
        const currentList = [...queueRef.current];
        const shuffled = [...currentList].sort(() => Math.random() - 0.5);
        if (cur) {
          // Keep current song at index 0
          const withoutCur = shuffled.filter((s) => s.id !== cur.id);
          setQueue([cur, ...withoutCur]);
        } else {
          setQueue(shuffled);
        }
      } else {
        // Restore original queue
        setQueue(originalQueue.length > 0 ? originalQueue : songs);
      }
      return nextShuffle;
    });
  }, [originalQueue, songs]);

  // Cycle Repeat Mode
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Favorite toggle
  const toggleFavorite = useCallback(
    async (songId: string) => {
      const isFav = await db.toggleSongFavorite(songId);
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, favorite: isFav } : s))
      );
      if (currentSong?.id === songId) {
        setCurrentSong((prev) => (prev ? { ...prev, favorite: isFav } : null));
      }
    },
    [currentSong]
  );

  // Delete song
  const deleteSong = useCallback(
    async (songId: string) => {
      await db.deleteSong(songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setQueue((prev) => prev.filter((s) => s.id !== songId));
      if (currentSong?.id === songId) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentSong(null);
        setIsPlaying(false);
      }
      updateStorageStats();
    },
    [currentSong]
  );

  // Register Media Session callbacks
  useEffect(() => {
    MediaSessionController.getInstance().registerActionHandlers({
      onPlay: togglePlay,
      onPause: togglePlay,
      onPrevious: handlePrevTrack,
      onNext: handleNextTrack,
      onSeekTo: seek,
      onSeekBackward: (offset) => {
        if (audioRef.current) seek(Math.max(0, audioRef.current.currentTime - offset));
      },
      onSeekForward: (offset) => {
        if (audioRef.current) seek(Math.min(duration, audioRef.current.currentTime + offset));
      },
    });
  }, [togglePlay, handlePrevTrack, handleNextTrack, seek, duration]);

  // Equalizer Gain Update
  const setEqGain = useCallback((index: number, gain: number) => {
    setEqGains((prev) => {
      const next = [...prev] as [number, number, number, number, number];
      next[index] = gain;
      if (filterNodesRef.current[index]) {
        filterNodesRef.current[index].gain.value = gain;
      }
      return next;
    });
    setEqPresetState('Custom');
  }, []);

  // Equalizer Preset Update
  const setEqPreset = useCallback((name: EqualizerPresetName) => {
    setEqPresetState(name);
    const gains = EQUALIZER_PRESETS[name];
    if (gains) {
      setEqGains(gains);
      gains.forEach((val, i) => {
        if (filterNodesRef.current[i]) {
          filterNodesRef.current[i].gain.value = val;
        }
      });
    }
  }, []);

  // Sleep Timer Controller
  const startSleepTimer = useCallback((minutes: number, endOfTrack = false) => {
    if (endOfTrack) {
      setSleepTimer({
        active: true,
        minutesRemaining: 0,
        totalMinutes: 0,
        endOfTrack: true,
      });
      return;
    }

    const target = Date.now() + minutes * 60 * 1000;
    setSleepTimer({
      active: true,
      minutesRemaining: minutes,
      totalMinutes: minutes,
      endOfTrack: false,
      targetTimestamp: target,
    });
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer({
      active: false,
      minutesRemaining: 0,
      totalMinutes: 0,
      endOfTrack: false,
    });
  }, []);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.endOfTrack || !sleepTimer.targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = (sleepTimer.targetTimestamp || 0) - now;
      if (diffMs <= 0) {
        // Timer completed! Fade out and pause
        clearInterval(interval);
        if (audioRef.current) {
          let curVol = audioRef.current.volume;
          const fadeInterval = setInterval(() => {
            curVol = Math.max(0, curVol - 0.1);
            if (audioRef.current) audioRef.current.volume = curVol;
            if (curVol <= 0.05) {
              clearInterval(fadeInterval);
              audioRef.current?.pause();
              setIsPlaying(false);
              setVolume(volume); // reset master volume for next play
            }
          }, 200);
        }
        cancelSleepTimer();
      } else {
        const remainingMinutes = Math.ceil(diffMs / 60000);
        setSleepTimer((prev) => ({ ...prev, minutesRemaining: remainingMinutes }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.active, sleepTimer.endOfTrack, sleepTimer.targetTimestamp, cancelSleepTimer, volume, setVolume]);

  return (
    <AudioContext.Provider
      value={{
        songs,
        playlists,
        filteredSongs,
        refreshSongs,
        refreshPlaylists,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        repeatMode,
        isShuffle,
        isLoadingAudio,
        queue,
        playSong,
        togglePlay,
        playNext: handleNextTrack,
        playPrevious: handlePrevTrack,
        seek,
        setVolume,
        setPlaybackRate,
        toggleShuffle,
        cycleRepeatMode,
        toggleFavorite,
        deleteSong,
        sleepTimer,
        startSleepTimer,
        cancelSleepTimer,
        eqPreset,
        eqGains,
        setEqPreset,
        setEqGain,
        analyserNode: analyserNodeRef.current,
        isFullPlayerOpen,
        setIsFullPlayerOpen,
        isUploadOpen,
        setIsUploadOpen,
        isPlaylistModalOpen,
        setIsPlaylistModalOpen,
        isEqualizerOpen,
        setIsEqualizerOpen,
        isSleepTimerOpen,
        setIsSleepTimerOpen,
        selectedSongForPlaylist,
        setSelectedSongForPlaylist,
        storageInfo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return ctx;
}
