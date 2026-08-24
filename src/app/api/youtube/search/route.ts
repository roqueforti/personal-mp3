import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface YouTubeSearchResult {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  streamUrl?: string;
  source: 'youtube' | 'itunes';
  viewCountText?: string;
}

function parseISODuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// 1. Official YouTube Data API v3 Search
async function searchYouTubeOfficial(
  query: string,
  apiKey: string
): Promise<YouTubeSearchResult[]> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(
      query.trim()
    )}&key=${apiKey.trim()}`;

    const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
    if (!searchRes.ok) {
      console.warn('YouTube API search status:', searchRes.status);
      return [];
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) return [];

    const videoIds = items
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(',');

    if (!videoIds) return [];

    // Fetch video contentDetails for exact duration & stats
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${apiKey.trim()}`;
    const videosRes = await fetch(videosUrl, { next: { revalidate: 3600 } });
    const videosData = await videosRes.json();
    const videoDetails = videosData.items || [];

    const results: YouTubeSearchResult[] = videoDetails.map((v: any) => {
      const durationSec = parseISODuration(v.contentDetails?.duration || 'PT0S');
      const views = Number(v.statistics?.viewCount || 0);
      const viewsFormatted =
        views > 1000000
          ? `${(views / 1000000).toFixed(1)}M views`
          : views > 1000
          ? `${(views / 1000).toFixed(0)}K views`
          : `${views} views`;

      const thumbnail =
        v.snippet?.thumbnails?.high?.url ||
        v.snippet?.thumbnails?.medium?.url ||
        v.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

      return {
        id: `yt_${v.id}`,
        videoId: v.id,
        title: v.snippet?.title || 'Unknown Title',
        artist: v.snippet?.channelTitle || 'YouTube Music',
        album: 'YouTube',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        thumbnail,
        source: 'youtube' as const,
        viewCountText: viewsFormatted,
      };
    });

    return results;
  } catch (err) {
    console.error('YouTube Data API v3 error:', err);
    return [];
  }
}

// 2. iTunes Global Music Search (Instant Fallback / Enhancement)
async function searchITunes(query: string): Promise<YouTubeSearchResult[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query.trim()
    )}&media=music&entity=song&limit=15`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      const durationSec = Math.round((item.trackTimeMillis || 0) / 1000);
      const thumbnail =
        item.artworkUrl100?.replace('100x100bb', '600x600bb') ||
        item.artworkUrl60 ||
        '';

      return {
        id: `itunes_${item.trackId}`,
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Online Track',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        thumbnail,
        streamUrl: item.previewUrl,
        source: 'itunes' as const,
        viewCountText: item.primaryGenreName ? `Genre: ${item.primaryGenreName}` : 'HD Audio',
      };
    });
  } catch (err) {
    console.warn('iTunes search note:', err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const clientApiKey = request.headers.get('x-youtube-api-key') || searchParams.get('key') || '';

  const apiKey =
    clientApiKey ||
    process.env.YOUTUBE_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    '';

  if (!query.trim()) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    let ytResults: YouTubeSearchResult[] = [];

    // If API Key available, fetch directly from official YouTube Data API v3
    if (apiKey) {
      ytResults = await searchYouTubeOfficial(query, apiKey);
    }

    // Also fetch iTunes catalog for comprehensive library blending
    const itunesResults = await searchITunes(query);

    const merged: YouTubeSearchResult[] = [];
    const seenTitles = new Set<string>();

    for (const item of ytResults) {
      const key = `${item.title.toLowerCase()}_${item.artist.toLowerCase()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(item);
      }
    }

    for (const item of itunesResults) {
      const key = `${item.title.toLowerCase()}_${item.artist.toLowerCase()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(item);
      }
    }

    return NextResponse.json({
      success: true,
      count: merged.length,
      hasYouTubeOfficial: Boolean(apiKey && ytResults.length > 0),
      results: merged.slice(0, 30),
    });
  } catch (err: any) {
    console.error('Unified music search error:', err);
    return NextResponse.json({ success: false, results: [], error: err.message }, { status: 500 });
  }
}
