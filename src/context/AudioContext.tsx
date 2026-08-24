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
import * as cloudApi from '@/lib/cloudApi';
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
  bufferedTime: number;
  bufferedPercentage: number;
  isCaching: boolean;
  cachingSongId: string | null;
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
  clearAllLocalSongs: () => Promise<void>;

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
  isCloudModalOpen: boolean;
  setIsCloudModalOpen: (open: boolean) => void;
  isStudioOpen: boolean;
  setIsStudioOpen: (open: boolean) => void;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  selectedSongForPlaylist: Song | null;
  setSelectedSongForPlaylist: (song: Song | null) => void;

  // Cloud Sync & Offline Download
  isCloudConnected: boolean;
  isSyncing: boolean;
  syncWithCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  downloadSongForOffline: (song: Song) => Promise<boolean>;
  downloadAllSongsForOffline: () => Promise<void>;
  isDownloadingAll: boolean;
  downloadProgress: { current: number; total: number; text: string };

  // Storage stats
  storageInfo: { usedBytes: number; quotaBytes: number; percentage: number; isPersisted: boolean };
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
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
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [bufferedPercentage, setBufferedPercentage] = useState<number>(0);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [cachingSongId, setCachingSongId] = useState<string | null>(null);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modals
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);

  // Cloud & Download state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, text: '' });

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
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoadingAudio(false);
      MediaSessionController.getInstance().updatePlaybackState('playing');
    };

    const onPause = () => {
      setIsPlaying(false);
      MediaSessionController.getInstance().updatePlaybackState('paused');
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
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

    const onCanPlay = () => {
      setIsLoadingAudio(false);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
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

    const onError = () => {
      console.warn('Audio playback note: streaming source waiting or switching.');
      setIsLoadingAudio(false);
    };

    const onProgress = () => {
      if (audio.buffered.length > 0) {
        let cur = audio.currentTime;
        let end = 0;
        for (let i = 0; i < audio.buffered.length; i++) {
          if (audio.buffered.start(i) <= cur && cur <= audio.buffered.end(i)) {
            end = audio.buffered.end(i);
            break;
          }
        }
        if (end === 0 && audio.buffered.length > 0) {
          end = audio.buffered.end(audio.buffered.length - 1);
        }
        setBufferedTime(end);
        if (audio.duration > 0) {
          setBufferedPercentage(Math.min(100, Math.max(0, (end / audio.duration) * 100)));
        }
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('loadeddata', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', () => setIsLoadingAudio(true));
    audio.addEventListener('playing', () => setIsLoadingAudio(false));
    audio.addEventListener('progress', onProgress);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('loadeddata', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('error', onError);
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

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserNodeRef.current = analyser;

      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      let lastNode: AudioNode = source;
      for (const f of filters) {
        lastNode.connect(f);
        lastNode = f;
      }
      lastNode.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API initialization note:', e);
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

  // Download a single song for offline playback
  const downloadSongForOffline = useCallback(async (song: Song): Promise<boolean> => {
    const url = song.streamUrl || (song.driveFileId ? `/api/audio?fileId=${song.driveFileId}` : '');
    if (!url) return false;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 1000) {
          const updated: Song = { ...song, blob };
          await db.saveSong(updated);
          setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
          updateStorageStats();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to download song for offline:', song.title, err);
    }
    return false;
  }, []);

  // Download all cloud songs to device memory
  const downloadAllSongsForOffline = useCallback(async () => {
    setIsDownloadingAll(true);
    try {
      const allDbSongs = await db.getAllSongs();
      const needDownload = allDbSongs.filter((s) => !s.blob && (s.streamUrl || s.driveFileId));
      const total = needDownload.length;

      setDownloadProgress({ current: 0, total, text: `Mendownload ${total} lagu...` });

      for (let i = 0; i < total; i++) {
        const song = needDownload[i];
        setDownloadProgress({
          current: i + 1,
          total,
          text: `Mendownload (${i + 1}/${total}): ${song.title}...`,
        });

        const url = song.streamUrl || (song.driveFileId ? `/api/audio?fileId=${song.driveFileId}` : '');
        if (url) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              if (blob && blob.size > 1000) {
                const updated: Song = { ...song, blob };
                await db.saveSong(updated);
                setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
              }
            }
          } catch (e) {
            console.warn('Offline download note for song:', song.title, e);
          }
        }
      }

      await refreshSongs();
    } catch (err) {
      console.error('Failed to download all songs:', err);
      updateStorageStats();
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0, text: '' });
    }
  }, [refreshSongs]);

  // Cloud Synchronization Function
  const syncWithCloud = useCallback(async () => {
    if (!cloudApi.isCloudConfigured()) {
      setIsCloudConnected(false);
      return;
    }

    setIsSyncing(true);
    setIsCloudConnected(true);

    try {
      // 1. Fetch cloud songs metadata
      const cloudSongs = await cloudApi.fetchCloudSongs();
      if (cloudSongs.length > 0) {
        const localSongs = await db.getAllSongs();
        const localMap = new Map(localSongs.map((s) => [s.id, s]));

        const songsToSave: Song[] = [];
        for (const cs of cloudSongs) {
          const existing = localMap.get(cs.id);
          if (existing) {
            songsToSave.push({
              ...existing,
              ...cs,
              blob: existing.blob,
            });
          } else {
            songsToSave.push(cs);
          }
        }

        await db.saveSongsBatch(songsToSave);
        await refreshSongs();
      }

      // 2. Fetch cloud playlists
      const cloudPls = await cloudApi.fetchCloudPlaylists();
      if (cloudPls.length > 0) {
        for (const pl of cloudPls) {
          await db.savePlaylist(pl);
        }
        await refreshPlaylists();
      }
    } catch (err) {
      console.error('Failed to sync with Google Apps Script cloud:', err);
    } finally {
      setIsSyncing(false);
      updateStorageStats();
    }
  }, []);

  useEffect(() => {
    refreshSongs();
    refreshPlaylists();
    if (cloudApi.isCloudConfigured()) {
      setIsCloudConnected(true);
      syncWithCloud();
    }
  }, [syncWithCloud]);

  // Filter & Search
  const filteredSongs = React.useMemo(() => {
    let result = [...songs];

    if (activeFilter === 'favorites') {
      result = result.filter((s) => s.favorite);
    } else if (activeFilter === 'recent') {
      result = result
        .filter((s) => (s.lastPlayed || 0) > 0)
        .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    } else if (activeFilter !== 'all') {
      const pl = playlists.find((p) => p.id === activeFilter);
      if (pl) {
        const idSet = new Set(pl.songIds);
        result = result.filter((s) => idSet.has(s.id));
      }
    }

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

  // Master Play Function (Guarantees Audio Blob is Available & Cached in IndexedDB)
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

      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      let audioBlob: Blob | null | undefined = song.blob;
      if (!audioBlob) {
        const full = await db.getSongById(song.id);
        audioBlob = full?.blob;
      }

      let audioSrc = '';

      if (audioBlob) {
        const objectUrl = URL.createObjectURL(audioBlob);
        activeBlobUrlRef.current = objectUrl;
        audioSrc = objectUrl;
        setBufferedPercentage(100);
        setIsCaching(false);
        setCachingSongId(null);
      } else {
        // Direct streaming playback (Supabase CDN or Drive proxy)
        const streamUrl = cloudApi.getAudioStreamUrl(song);
        if (streamUrl) {
          audioSrc = streamUrl;
          setBufferedPercentage(0);
          setBufferedTime(0);

          // Asynchronously download & cache blob in background for offline use
          setIsCaching(true);
          setCachingSongId(song.id);

          const fetchPromise = song.streamUrl
            ? fetch(song.streamUrl).then((r) => (r.ok ? r.blob() : null))
            : Promise.resolve(null);

          fetchPromise
            .then(async (blob) => {
              if (blob && blob.size > 1000) {
                const updated: Song = { ...song, blob };
                await db.saveSong(updated);
                setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
                setCurrentSong((cur) => (cur?.id === song.id ? updated : cur));
                updateStorageStats();

                // If stream is stalled / waiting for bytes, immediately swap to the downloaded blob!
                if (
                  audioRef.current &&
                  (audioRef.current.currentTime === 0 ||
                    audioRef.current.paused ||
                    audioRef.current.error ||
                    !audioRef.current.duration)
                ) {
                  const blobUrl = URL.createObjectURL(blob);
                  activeBlobUrlRef.current = blobUrl;
                  audioRef.current.src = blobUrl;
                  audioRef.current.play().catch(console.error);
                }
              }
            })
            .catch((err) => {
              console.warn('Background caching note:', err);
            })
            .finally(() => {
              setIsCaching(false);
              setCachingSongId((cur) => (cur === song.id ? null : cur));
            });
        }
      }

      if (!audioSrc) {
        console.warn(`Data audio untuk "${song.title}" tidak ditemukan.`);
        setIsLoadingAudio(false);
        return;
      }

      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;

      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
        db.incrementPlayCount(song.id);
        MediaSessionController.getInstance().updateMetadata(song);
        MediaSessionController.getInstance().updatePlaybackState('playing');
      } catch (err) {
        console.warn('Audio streaming buffering:', err);
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
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      nextIdx = 0;
    }

    playSong(currentList[nextIdx]);
  }, [playSong]);

  // Play Previous
  const handlePrevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
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

  // Toggle Play
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
    if (audioRef.current) audioRef.current.volume = clamped;
    if (gainNodeRef.current) gainNodeRef.current.gain.value = clamped;
  }, []);

  // Playback Rate
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  // Shuffle
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle) {
        const cur = currentSongRef.current;
        const currentList = [...queueRef.current];
        const shuffled = [...currentList].sort(() => Math.random() - 0.5);
        if (cur) {
          const withoutCur = shuffled.filter((s) => s.id !== cur.id);
          setQueue([cur, ...withoutCur]);
        } else {
          setQueue(shuffled);
        }
      } else {
        setQueue(originalQueue.length > 0 ? originalQueue : songs);
      }
      return nextShuffle;
    });
  }, [originalQueue, songs]);

  // Repeat
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
      if (cloudApi.isCloudConfigured()) {
        cloudApi.toggleCloudFavorite(songId).catch(console.error);
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
        if (audioRef.current) audioRef.current.pause();
        setCurrentSong(null);
        setIsPlaying(false);
      }
      updateStorageStats();
      if (cloudApi.isCloudConfigured()) {
        cloudApi.deleteSongFromCloud(songId).catch(console.error);
      }
    },
    [currentSong]
  );

  // Clear all local songs from IndexedDB
  const clearAllLocalSongs = useCallback(async () => {
    if (audioRef.current) audioRef.current.pause();
    setCurrentSong(null);
    setIsPlaying(false);
    await db.clearAllSongs();
    setSongs([]);
    setQueue([]);
    updateStorageStats();
  }, []);

  // MediaSession Handlers
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

  // Sleep Timer
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

  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.endOfTrack || !sleepTimer.targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = (sleepTimer.targetTimestamp || 0) - now;
      if (diffMs <= 0) {
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
              setVolume(volume);
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
        bufferedTime,
        bufferedPercentage,
        isCaching,
        cachingSongId,
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
        clearAllLocalSongs,
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
        isCloudModalOpen,
        setIsCloudModalOpen,
        isStudioOpen,
        setIsStudioOpen,
        setSongs,
        selectedSongForPlaylist,
        setSelectedSongForPlaylist,
        isCloudConnected,
        isSyncing,
        syncWithCloud,
        syncFromCloud: syncWithCloud,
        downloadSongForOffline,
        downloadAllSongsForOffline,
        isDownloadingAll,
        downloadProgress,
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
