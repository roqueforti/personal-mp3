import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song, Playlist } from '@/types/music';

interface MusicDBSchema extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-date': number;
      'by-title': string;
      'by-artist': string;
      'by-favorite': number;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      'by-name': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'SonicVaultDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MusicDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<MusicDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser'));
  }

  if (!dbPromise) {
    dbPromise = openDB<MusicDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Songs store
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('by-date', 'dateAdded');
          songStore.createIndex('by-title', 'title');
          songStore.createIndex('by-artist', 'artist');
          songStore.createIndex('by-favorite', 'favorite');
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('by-name', 'name');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }

  return dbPromise;
}

// ----------------- Song CRUD ----------------- //

export async function saveSong(song: Song): Promise<void> {
  const db = await getDB();
  await db.put('songs', song);
}

export async function saveSongsBatch(songs: Song[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('songs', 'readwrite');
  for (const song of songs) {
    await tx.store.put(song);
  }
  await tx.done;
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB();
  const songs = await db.getAll('songs');
  // Sort descending by dateAdded
  return songs.sort((a, b) => b.dateAdded - a.dateAdded);
}

export async function getSongById(id: string): Promise<Song | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('songs', id);

  // Also remove from any playlists
  const playlists = await getAllPlaylists();
  for (const pl of playlists) {
    if (pl.songIds.includes(id)) {
      pl.songIds = pl.songIds.filter(sId => sId !== id);
      await savePlaylist(pl);
    }
  }
}

export async function toggleSongFavorite(id: string): Promise<boolean> {
  const db = await getDB();
  const song = await db.get('songs', id);
  if (!song) return false;
  
  song.favorite = !song.favorite;
  await db.put('songs', song);
  return !!song.favorite;
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await getDB();
  const song = await db.get('songs', id);
  if (song) {
    song.playCount = (song.playCount || 0) + 1;
    song.lastPlayed = Date.now();
    await db.put('songs', song);
  }
}

// ----------------- Playlist CRUD ----------------- //

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

// ----------------- Settings / Storage Stats ----------------- //

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    const val = await db.get('settings', key);
    return val !== undefined ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', value, key);
  } catch (err) {
    console.error('Failed to save setting:', err);
  }
}

export async function getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number; isPersisted: boolean }> {
  let isPersisted = false;
  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }
      if (!isPersisted && navigator.storage.persist) {
        isPersisted = await navigator.storage.persist();
      }
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1;
      return {
        usedBytes: used,
        quotaBytes: quota,
        percentage: Math.min(100, Math.round((used / quota) * 100)),
        isPersisted,
      };
    } catch {
      // Fallback
    }
  }
  return { usedBytes: 0, quotaBytes: 0, percentage: 0, isPersisted: false };
}

