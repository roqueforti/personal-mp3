async function checkUrl() {
  const url = 'https://zsgoergtarrthimzmler.supabase.co/storage/v1/object/public/songs/audio/1787541356916_radiohead_-_let_down_choir_complete_new_version.mp3';
  console.log('Testing HEAD request to Supabase audio URL:', url);

  const res = await fetch(url, { method: 'HEAD' });
  console.log('Status:', res.status, res.statusText);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Length:', res.headers.get('content-length'));
  console.log('Accept-Ranges:', res.headers.get('accept-ranges'));
  console.log('Access-Control-Allow-Origin:', res.headers.get('access-control-allow-origin'));
}

checkUrl();
