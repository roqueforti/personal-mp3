import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Song, Playlist } from '@/types/music';

const SUPABASE_URL_KEY = 'sonicvault_supabase_url';
const SUPABASE_ANON_KEY = 'sonicvault_supabase_anon_key';

export function getSupabaseUrl(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const stored = localStorage.getItem(SUPABASE_URL_KEY);
  if (stored && stored.trim()) return stored.trim();
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

export function getSupabaseAnonKey(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const stored = localStorage.getItem(SUPABASE_ANON_KEY);
  if (stored && stored.trim()) return stored.trim();
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && url.startsWith('http') && key && key.length > 20);
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// ----------------- SQL Schema Setup Template ----------------- //
export const SUPABASE_SQL_SETUP = `-- 🎵 SonicVault - Supabase Database & Storage Setup Script
-- Jalankan script ini di menu "SQL Editor" di Dashboard Supabase Anda (1-Click Run)

-- 1. Buat tabel songs
create table if not exists public.songs (
  id text primary key,
  title text not null,
  artist text default 'Unknown Artist',
  album text default 'SonicVault',
  duration float8 default 0,
  file_size bigint default 0,
  mime_type text default 'audio/mpeg',
  stream_url text not null,
  cover_art text default '',
  lyrics text default '',
  favorite boolean default false,
  play_count bigint default 0,
  created_at timestamp with time zone default now()
);

-- 2. Buat tabel playlists
create table if not exists public.playlists (
  id text primary key,
  name text not null,
  song_ids jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 3. Aktifkan RLS & buat Policy Akses Publik (Anonim)
alter table public.songs enable row level security;
alter table public.playlists enable row level security;

-- Drop existing policies if any to prevent duplicate errors
drop policy if exists "Allow public read songs" on public.songs;
drop policy if exists "Allow public insert songs" on public.songs;
drop policy if exists "Allow public update songs" on public.songs;
drop policy if exists "Allow public delete songs" on public.songs;

create policy "Allow public read songs" on public.songs for select using (true);
create policy "Allow public insert songs" on public.songs for insert with check (true);
create policy "Allow public update songs" on public.songs for update using (true);
create policy "Allow public delete songs" on public.songs for delete using (true);

-- Drop existing playlist policies if any
drop policy if exists "Allow public read playlists" on public.playlists;
drop policy if exists "Allow public insert playlists" on public.playlists;
drop policy if exists "Allow public update playlists" on public.playlists;
drop policy if exists "Allow public delete playlists" on public.playlists;

create policy "Allow public read playlists" on public.playlists for select using (true);
create policy "Allow public insert playlists" on public.playlists for insert with check (true);
create policy "Allow public update playlists" on public.playlists for update using (true);
create policy "Allow public delete playlists" on public.playlists for delete using (true);

-- 4. Buat Storage Bucket "songs" untuk Audio Streaming CDN
insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do update set public = true;

-- Policy Storage Bucket songs
drop policy if exists "Public Access Storage" on storage.objects;
drop policy if exists "Public Insert Storage" on storage.objects;
drop policy if exists "Public Update Storage" on storage.objects;
drop policy if exists "Public Delete Storage" on storage.objects;

create policy "Public Access Storage" on storage.objects for select using (bucket_id = 'songs');
create policy "Public Insert Storage" on storage.objects for insert with check (bucket_id = 'songs');
create policy "Public Update Storage" on storage.objects for update using (bucket_id = 'songs');
create policy "Public Delete Storage" on storage.objects for delete using (bucket_id = 'songs');
`;

// ----------------- Cloud Operations ----------------- //

export async function pingSupabase(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = (url || getSupabaseUrl()).trim();
  const testKey = (key || getSupabaseAnonKey()).trim();

  if (!testUrl || !testKey) {
    return { success: false, message: 'URL atau Anon Key Supabase belum diisi.' };
  }

  try {
    const client = createClient(testUrl, testKey, { auth: { persistSession: false } });
    const { error } = await client.from('songs').select('id').limit(1);

    if (error) {
      if (error.message.includes('relation "public.songs" does not exist')) {
        return {
          success: true,
          message: 'Terhubung ke Supabase! (Tabel "songs" belum dibuat, silakan jalankan SQL Setup).',
        };
      }
      return { success: false, message: 'Error Supabase: ' + error.message };
    }

    return { success: true, message: 'Koneksi ke Supabase Database & Storage Berhasil Aktif!' };
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung: ' + (err.message || String(err)) };
  }
}

// Upload Audio to Supabase Storage Bucket 'songs'
export async function uploadAudioToSupabase(
  audioBlob: Blob,
  filename: string
): Promise<{ url: string; size: number } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const sanitizedName = filename
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '_')
      .replace(/_+/g, '_');
    const path = `audio/${Date.now()}_${sanitizedName}`;

    const { data, error } = await client.storage
      .from('songs')
      .upload(path, audioBlob, {
        contentType: audioBlob.type || 'audio/mpeg',
        upsert: true,
      });

    if (error || !data) {
      console.error('Supabase storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = client.storage.from('songs').getPublicUrl(data.path);
    return {
      url: publicUrlData.publicUrl,
      size: audioBlob.size,
    };
  } catch (err) {
    console.error('Failed to upload audio to Supabase:', err);
    return null;
  }
}

// Upload Cover Art to Supabase Storage Bucket 'songs'
export async function uploadCoverArtToSupabase(
  coverBlob: Blob,
  songId: string
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const path = `covers/${songId}_${Date.now()}.jpg`;
    const { data, error } = await client.storage
      .from('songs')
      .upload(path, coverBlob, {
        contentType: coverBlob.type || 'image/jpeg',
        upsert: true,
      });

    if (error || !data) return null;

    const { data: publicUrlData } = client.storage.from('songs').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload cover art to Supabase:', err);
    return null;
  }
}

// Fetch all songs from Supabase PostgreSQL
export async function fetchSongsFromSupabase(): Promise<Song[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching songs from Supabase:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title || 'Unknown Title',
      artist: row.artist || 'Unknown Artist',
      album: row.album || 'SonicVault',
      duration: Number(row.duration) || 0,
      fileSize: Number(row.file_size) || 0,
      mimeType: row.mime_type || 'audio/mpeg',
      streamUrl: row.stream_url,
      coverArt: row.cover_art || '',
      lyrics: row.lyrics || '',
      favorite: Boolean(row.favorite),
      playCount: Number(row.play_count) || 0,
      dateAdded: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));
  } catch (err) {
    console.error('Failed to fetch songs from Supabase:', err);
    return [];
  }
}

// Save or Update Song in Supabase PostgreSQL
export async function saveSongToSupabase(song: Song): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist || 'Unknown Artist',
      album: song.album || 'SonicVault',
      duration: song.duration || 0,
      file_size: song.fileSize || 0,
      stream_url: song.streamUrl || '',
      cover_art: song.coverArt || '',
      lyrics: song.lyrics || '',
      favorite: Boolean(song.favorite),
      play_count: song.playCount || 0,
    };

    const { error } = await client.from('songs').upsert(payload);
    if (error) {
      console.error('Error saving song to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save song to Supabase:', err);
    return false;
  }
}

// Delete Song from Supabase Database & Storage
export async function deleteSongFromSupabase(song: Song): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Delete record from table
    const { error } = await client.from('songs').delete().eq('id', song.id);
    if (error) console.warn('Supabase DB delete error:', error);

    // 2. Try deleting audio file from Storage if it's hosted on Supabase
    if (song.streamUrl && song.streamUrl.includes('/storage/v1/object/public/songs/')) {
      const parts = song.streamUrl.split('/storage/v1/object/public/songs/');
      if (parts[1]) {
        await client.storage.from('songs').remove([parts[1]]);
      }
    }

    // 3. Try deleting cover art from Storage if it's hosted on Supabase
    if (song.coverArt && song.coverArt.includes('/storage/v1/object/public/songs/')) {
      const parts = song.coverArt.split('/storage/v1/object/public/songs/');
      if (parts[1]) {
        await client.storage.from('songs').remove([parts[1]]);
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to delete song from Supabase:', err);
    return false;
  }
}

// Toggle Favorite in Supabase
export async function toggleFavoriteInSupabase(songId: string, isFav: boolean): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('songs').update({ favorite: isFav }).eq('id', songId);
    return !error;
  } catch (err) {
    console.error('Failed to toggle favorite in Supabase:', err);
    return false;
  }
}

// Playlists CRUD
export async function fetchPlaylistsFromSupabase(): Promise<Playlist[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.from('playlists').select('*');
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      songIds: Array.isArray(row.song_ids) ? row.song_ids : [],
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));
  } catch (err) {
    console.error('Failed to fetch playlists from Supabase:', err);
    return [];
  }
}

export async function savePlaylistToSupabase(playlist: Playlist): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('playlists').upsert({
      id: playlist.id,
      name: playlist.name,
      song_ids: playlist.songIds || [],
    });
    return !error;
  } catch (err) {
    console.error('Failed to save playlist to Supabase:', err);
    return false;
  }
}

export async function deletePlaylistFromSupabase(playlistId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('playlists').delete().eq('id', playlistId);
    return !error;
  } catch (err) {
    console.error('Failed to delete playlist from Supabase:', err);
    return false;
  }
}
