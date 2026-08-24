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

// Convert base64 data to Blob
export function base64ToBlob(base64: string, mimeType = 'audio/mpeg'): Blob {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
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

export function getAudioStreamUrl(song: Song): string {
  const appScriptUrl = getAppScriptUrl();
  const endpointParam = appScriptUrl ? `&endpoint=${encodeURIComponent(appScriptUrl)}` : '';

  if (song.driveFileId) {
    return `/api/audio?fileId=${encodeURIComponent(song.driveFileId)}${endpointParam}`;
  }
  if (song.streamUrl) {
    const match = song.streamUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) {
      return `/api/audio?fileId=${encodeURIComponent(match[1])}${endpointParam}`;
    }
    return `/api/audio?url=${encodeURIComponent(song.streamUrl)}`;
  }
  return '';
}

export async function fetchSongAudioBlob(driveFileId: string): Promise<Blob | null> {
  if (!driveFileId) return null;

  const endpoint = getAppScriptUrl();
  const endpointParam = endpoint ? `&endpoint=${encodeURIComponent(endpoint)}` : '';

  // 1. Primary: Fetch through Next.js same-origin API proxy (bypasses browser CORS & handles Google Drive streaming)
  try {
    const res = await fetch(`/api/audio?fileId=${encodeURIComponent(driveFileId)}${endpointParam}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
        const blob = await res.blob();
        if (blob && blob.size > 5000) {
          return blob;
        }
      }
    }
  } catch (err) {
    console.warn('Local proxy /api/audio fetch error, attempting Apps Script fallback...', err);
  }

  // 2. Secondary: Fetch through Google Apps Script endpoint
  if (endpoint) {
    try {
      const res = await fetch(`${endpoint}?action=getAudio&fileId=${encodeURIComponent(driveFileId)}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.base64) {
          const blob = base64ToBlob(data.base64, data.mimeType || 'audio/mpeg');
          if (blob.size > 1000) {
            return blob;
          }
        }
      }
    } catch (err) {
      console.warn('Apps Script getAudio fetch failed, trying direct Google Drive links...', err);
    }
  }

  // 3. Tertiary: Try direct public Google Drive URLs
  const directUrls = [
    `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download&authuser=0`,
    `https://lh3.googleusercontent.com/d/${driveFileId}`,
    `https://drive.google.com/uc?export=download&id=${driveFileId}`,
    `https://docs.google.com/uc?export=download&id=${driveFileId}`
  ];

  for (const dUrl of directUrls) {
    try {
      const res = await fetch(dUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 5000) {
          return blob;
        }
      }
    } catch {}
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
