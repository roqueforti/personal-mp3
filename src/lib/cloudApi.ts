import { Song, Playlist } from '@/types/music';
import * as supabase from './supabase';

export function isCloudConfigured(): boolean {
  return supabase.isSupabaseConfigured();
}

export function getCloudProvider(): 'supabase' | 'none' {
  return supabase.isSupabaseConfigured() ? 'supabase' : 'none';
}

export async function pingCloud(): Promise<{ success: boolean; message: string }> {
  return await supabase.pingSupabase();
}

export async function fetchCloudSongs(): Promise<Song[]> {
  if (supabase.isSupabaseConfigured()) {
    return await supabase.fetchSongsFromSupabase();
  }
  return [];
}

export async function fetchCloudPlaylists(): Promise<Playlist[]> {
  if (supabase.isSupabaseConfigured()) {
    return await supabase.fetchPlaylistsFromSupabase();
  }
  return [];
}

export function getAudioStreamUrl(song: Song): string {
  if (song.streamUrl) {
    return song.streamUrl;
  }
  return '';
}

export async function uploadSongToCloud(song: Song, audioBlob: Blob): Promise<Song | null> {
  const audioResult = await supabase.uploadAudioToSupabase(audioBlob, `${song.title}.mp3`);
  if (!audioResult) return null;

  const uploadedSong: Song = {
    ...song,
    streamUrl: audioResult.url,
    fileSize: audioResult.size,
  };

  const saved = await supabase.saveSongToSupabase(uploadedSong);
  if (!saved) return null;

  return uploadedSong;
}

export async function deleteSongFromCloud(songId: string): Promise<boolean> {
  const songs = await supabase.fetchSongsFromSupabase();
  const target = songs.find((s) => s.id === songId);
  if (target) {
    return await supabase.deleteSongFromSupabase(target);
  }
  return true;
}

export async function toggleCloudFavorite(songId: string, isFav = true): Promise<boolean> {
  return await supabase.toggleFavoriteInSupabase(songId, isFav);
}

export async function saveCloudPlaylist(playlist: Playlist): Promise<boolean> {
  return await supabase.savePlaylistToSupabase(playlist);
}

export async function deleteCloudPlaylist(playlistId: string): Promise<boolean> {
  return await supabase.deletePlaylistFromSupabase(playlistId);
}
