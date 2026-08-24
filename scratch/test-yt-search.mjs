async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  const html = await res.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
  if (!match) {
    console.error('ytInitialData not found');
    return [];
  }

  const data = JSON.parse(match[1]);
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  const results = [];
  for (const item of contents) {
    const v = item?.videoRenderer;
    if (v && v.videoId) {
      const title = v.title?.runs?.[0]?.text || '';
      const artist = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || '';
      const durationText = v.lengthText?.simpleText || '0:00';
      const thumbnail = v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
      const viewCountText = v.viewCountText?.simpleText || '';

      // Parse duration to seconds
      const parts = durationText.split(':').map(Number);
      let durationSec = 0;
      if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
      else if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];

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

  return results;
}

async function run() {
  console.log('Testing YouTube search for "Radiohead Creep"...');
  const results = await searchYouTube('Radiohead Creep');
  console.log(`Found ${results.length} results:`);
  console.log(results.slice(0, 4));
}

run();
