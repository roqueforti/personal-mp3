async function testAudioStream(videoId) {
  // Test Piped / Invidious / Cobalt audio stream endpoints
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://piped-api.garudalinux.org',
    'https://api.invidious.io',
  ];

  console.log(`Testing audio stream for videoId: ${videoId}`);

  for (const instance of pipedInstances) {
    try {
      console.log(`Checking ${instance}...`);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const audioStreams = data.audioStreams || [];
        console.log(`Found ${audioStreams.length} audio streams on ${instance}!`);
        if (audioStreams.length > 0) {
          const best = audioStreams[0];
          console.log('Best audio stream:', {
            url: best.url.substring(0, 80) + '...',
            mimeType: best.mimeType,
            quality: best.quality,
            bitrate: best.bitrate,
          });
          return best.url;
        }
      }
    } catch (e) {
      console.warn(`Instance ${instance} failed:`, e.message);
    }
  }

  return null;
}

testAudioStream('XFkzRNyygfk');
