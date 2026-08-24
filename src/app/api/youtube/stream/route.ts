import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveDirectAudioStream(title: string, artist: string): Promise<string | null> {
  const cleanTitle = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?video/gi, '')
    .replace(/lirik\s*(video)?/gi, '')
    .replace(/audio\s*(video)?/gi, '')
    .replace(/ft\.?|feat\.?/gi, '')
    .trim();

  const cleanArtist = artist
    .replace(/official|vevo|topic|channel/gi, '')
    .trim();

  const queries = [
    `${cleanTitle} ${cleanArtist}`.trim(),
    cleanTitle,
  ];

  // 1. Try Deezer Search for High-Quality Direct Audio Stream
  for (const q of queries) {
    if (!q) continue;
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=3`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const track = data.data[0];
          if (track.preview) {
            return track.preview;
          }
        }
      }
    } catch {}
  }

  // 2. Try iTunes Search for High-Quality Direct Audio Stream
  for (const q of queries) {
    if (!q) continue;
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const track = data.results[0];
          if (track.previewUrl) {
            return track.previewUrl;
          }
        }
      }
    } catch {}
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId') || '';
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';

  if (!videoId && !title) {
    return NextResponse.json({ success: false, error: 'Missing videoId or title parameter' }, { status: 400 });
  }

  try {
    const streamUrl = await resolveDirectAudioStream(title, artist);
    if (streamUrl) {
      return NextResponse.json({
        success: true,
        streamUrl,
        directAudio: true,
      });
    }

    return NextResponse.json({
      success: false,
      streamUrl: null,
      directAudio: false,
      message: 'Direct audio stream not found, use iframe fallback',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
