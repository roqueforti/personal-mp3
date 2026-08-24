async function testProviders(query) {
  console.log(`--- Testing Search for: "${query}" ---`);

  // Provider 1: iTunes Search API (100% reliable, official, fast, free, covers all songs)
  try {
    console.log('1. Testing iTunes Music Search API...');
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`;
    const res = await fetch(itunesUrl);
    if (res.ok) {
      const data = await res.json();
      console.log(`iTunes found ${data.resultCount} tracks!`);
      if (data.results && data.results.length > 0) {
        const first = data.results[0];
        console.log('Sample iTunes result:', {
          title: first.trackName,
          artist: first.artistName,
          duration: Math.round(first.trackTimeMillis / 1000),
          previewUrl: first.previewUrl,
          cover: first.artworkUrl100?.replace('100x100bb', '600x600bb'),
        });
      }
    }
  } catch (e) {
    console.error('iTunes failed:', e.message);
  }

  // Provider 2: Invidious Public Instances
  const invidiousHosts = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://vid.puffyan.us',
    'https://invidious.drgns.space',
  ];

  for (const host of invidiousHosts) {
    try {
      console.log(`2. Testing Invidious on ${host}...`);
      const invUrl = `${host}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const res = await fetch(invUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Invidious on ${host} found ${data.length} videos!`);
          console.log('Sample Invidious result:', {
            videoId: data[0].videoId,
            title: data[0].title,
            artist: data[0].author,
            duration: data[0].lengthSeconds,
          });
          break;
        }
      }
    } catch (e) {
      console.warn(`Invidious on ${host} note:`, e.message);
    }
  }

  // Provider 3: YouTube HTML Scraping with Consent bypass cookie
  try {
    console.log('3. Testing YouTube direct search with SOCS consent cookie...');
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`;
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': 'SOCS=CAESEwgDEgk2MTQ1NzE2OTUaAmVuIAEaBgiA_LyaBg; CONSENT=PENDING+999;',
      },
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      console.log(`YouTube direct search found ${contents.length} raw items!`);
    } else {
      console.log('YouTube HTML did not contain ytInitialData (Consent/Captcha block)');
    }
  } catch (e) {
    console.error('YouTube direct error:', e.message);
  }
}

testProviders('Tulus');
