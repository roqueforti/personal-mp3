import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface YouTubeSearchResult {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  viewCountText: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim() + ' audio')}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, results: [], error: 'YouTube search failed' }, { status: 500 });
    }

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);

    if (!match) {
      return NextResponse.json({ success: true, results: [] });
    }

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents || [];

    const results: YouTubeSearchResult[] = [];

    for (const item of contents) {
      const v = item?.videoRenderer;
      if (v && v.videoId) {
        const title = v.title?.runs?.[0]?.text || '';
        const artist =
          v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'YouTube Music';
        const durationText = v.lengthText?.simpleText || '0:00';
        const thumbnail =
          v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
        const viewCountText = v.viewCountText?.simpleText || '';

        // Clean duration to seconds
        const parts = durationText.split(':').map(Number);
        let durationSec = 0;
        if (parts.length === 2) durationSec = (parts[0] || 0) * 60 + (parts[1] || 0);
        else if (parts.length === 3)
          durationSec = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);

        // Filter out very long videos (> 20 mins) to focus on music tracks
        if (durationSec > 0 && durationSec < 1200) {
          results.push({
            id: `yt_${v.videoId}`,
            videoId: v.videoId,
            title,
            artist,
            duration: durationSec,
            durationFormatted: durationText,
            thumbnail,
            viewCountText,
          });
        }
      }
    }

    return NextResponse.json({ success: true, results: results.slice(0, 20) });
  } catch (err: any) {
    console.error('YouTube search error:', err);
    return NextResponse.json({ success: false, results: [], error: err.message }, { status: 500 });
  }
}
