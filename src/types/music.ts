export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  mimeType: string;
  coverArt?: string; // Data URL or object URL
  blob?: Blob; // Raw audio file (in IndexedDB)
  driveFileId?: string; // Google Drive file ID
  streamUrl?: string; // Streaming audio URL (Supabase CDN / Google Drive / Proxy)
  lyrics?: string;
  genre?: string;
  dateAdded: number; // timestamp
  playCount: number;
  lastPlayed?: number;
  favorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  coverArt?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type EqualizerPresetName =
  | 'Flat'
  | 'Bass Boost'
  | 'Bass Reducer'
  | 'Vocal Boost'
  | 'Treble Boost'
  | 'Rock'
  | 'Pop'
  | 'Electronic'
  | 'Acoustic'
  | 'Custom';

export interface EqualizerPreset {
  name: EqualizerPresetName;
  gains: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz in dB (-12 to +12)
}

export interface SleepTimerState {
  active: boolean;
  minutesRemaining: number;
  totalMinutes: number;
  endOfTrack: boolean;
  targetTimestamp?: number;
}
