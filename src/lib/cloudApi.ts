import { Song, Playlist } from '@/types/music';

const APPSCRIPT_STORAGE_KEY = 'sonicvault_appscript_url';

export function getAppScriptUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(APPSCRIPT_STORAGE_KEY);
  if (stored) return stored.trim();
  return process.env.NEXT_PUBLIC_APPSCRIPT_URL || '';
}

export function setAppScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(APPSCRIPT_STORAGE_KEY, url.trim());
}

export function isCloudConfigured(): boolean {
  const url = getAppScriptUrl();
  return Boolean(url && url.startsWith('http'));
}

// Convert File / Blob to Base64 String
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ----------------- Cloud Endpoints ----------------- //

export async function pingCloud(url?: string): Promise<{ success: boolean; message: string }> {
  const endpoint = url || getAppScriptUrl();
  if (!endpoint) return { success: false, message: 'URL Apps Script belum diisi' };

  try {
    const res = await fetch(`${endpoint}?action=ping`, { method: 'GET' });
    const data = await res.json();
    if (data.status === 'ok') {
      return { success: true, message: data.message || 'Koneksi Berhasil!' };
    }
    return { success: false, message: data.message || 'Respons tidak dikenali' };
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung: ' + (err.message || String(err)) };
  }
}

export async function fetchCloudSongs(): Promise<Song[]> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return [];

  try {
    const res = await fetch(`${endpoint}?action=getSongs`, { method: 'GET' });
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.songs)) {
      return data.songs;
    }
    return [];
  } catch (err) {
    console.error('Error fetching cloud songs:', err);
    return [];
  }
}

export async function fetchCloudPlaylists(): Promise<Playlist[]> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return [];

  try {
    const res = await fetch(`${endpoint}?action=getPlaylists`, { method: 'GET' });
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.playlists)) {
      return data.playlists;
    }
    return [];
  } catch (err) {
    console.error('Error fetching cloud playlists:', err);
    return [];
  }
}

export async function fetchSongAudioBlob(driveFileId: string): Promise<Blob | null> {
  const endpoint = getAppScriptUrl();
  if (!endpoint || !driveFileId) return null;

  try {
    const res = await fetch(`${endpoint}?action=getAudio&fileId=${driveFileId}`, { method: 'GET' });
    const data = await res.json();
    if (data.status === 'success' && data.base64) {
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      return new Blob([byteNumbers], { type: data.mimeType || 'audio/mpeg' });
    }
  } catch (err) {
    console.error('Error fetching audio blob from Google Apps Script:', err);
  }
  return null;
}

export async function uploadSongToCloud(song: Song, fileBlob: Blob): Promise<Song | null> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return null;

  try {
    const base64Data = await fileToBase64(fileBlob);
    
    const payload = {
      action: 'uploadSong',
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      fileSize: song.fileSize,
      mimeType: song.mimeType || 'audio/mpeg',
      coverArt: song.coverArt || '',
      base64Data: base64Data,
      filename: `${song.title}.mp3`,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.status === 'success' && data.song) {
      return data.song;
    }
    return null;
  } catch (err) {
    console.error('Error uploading song to Apps Script cloud:', err);
    return null;
  }
}

export async function deleteSongFromCloud(songId: string): Promise<boolean> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return false;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteSong', songId }),
    });
    const data = await res.json();
    return data.status === 'success';
  } catch (err) {
    console.error('Error deleting song from cloud:', err);
    return false;
  }
}

export async function toggleCloudFavorite(songId: string): Promise<boolean> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return false;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'toggleFavorite', songId }),
    });
    const data = await res.json();
    return Boolean(data.isFavorite);
  } catch (err) {
    console.error('Error toggling cloud favorite:', err);
    return false;
  }
}

export async function savePlaylistToCloud(playlist: Playlist): Promise<boolean> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return false;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'savePlaylist', playlist }),
    });
    const data = await res.json();
    return data.status === 'success';
  } catch (err) {
    console.error('Error saving playlist to cloud:', err);
    return false;
  }
}

export async function deletePlaylistFromCloud(playlistId: string): Promise<boolean> {
  const endpoint = getAppScriptUrl();
  if (!endpoint) return false;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'deletePlaylist', playlistId }),
    });
    const data = await res.json();
    return data.status === 'success';
  } catch (err) {
    console.error('Error deleting playlist from cloud:', err);
    return false;
  }
}
