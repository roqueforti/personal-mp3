import { createClient } from '@supabase/supabase-js';

const url = 'https://zsgoergtarrthimzmler.supabase.co';
const key = 'sb_publishable_7oRakaQ40-gzBb34yVtv7w_CFZINjQp';

const client = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection...');
  const { data, error } = await client.from('songs').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Found songs count:', data.length);
    console.log('Songs sample:', data.slice(0, 3).map(s => ({ id: s.id, title: s.title, stream_url: s.stream_url })));
  }
}

test();
