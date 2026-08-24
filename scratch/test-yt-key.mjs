const API_KEY = 'AIzaSyB9jgibwq-8yHjBwZIcs85b-iJ_TCNnyfQ';

async function testApiKey() {
  console.log('Testing YouTube Data API v3 Key...');
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent('Tulus Hati Hati di Jalan')}&key=${API_KEY}`;

  const res = await fetch(searchUrl);
  console.log('Status:', res.status, res.statusText);

  if (res.ok) {
    const data = await res.json();
    console.log(`Found ${data.items?.length} YouTube videos!`);
    if (data.items && data.items.length > 0) {
      console.log('First video:', {
        videoId: data.items[0].id.videoId,
        title: data.items[0].snippet.title,
        channel: data.items[0].snippet.channelTitle,
      });
    }
  } else {
    const err = await res.text();
    console.error('API Error:', err);
  }
}

testApiKey();
