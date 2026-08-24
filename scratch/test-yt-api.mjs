// Function to parse ISO 8601 duration (e.g. PT4M20S -> 260 seconds)
function parseISODuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

console.log('Test ISO durations:');
console.log('PT3M45S ->', parseISODuration('PT3M45S'), 'Formatted:', formatDuration(parseISODuration('PT3M45S')));
console.log('PT1H2M30S ->', parseISODuration('PT1H2M30S'), 'Formatted:', formatDuration(parseISODuration('PT1H2M30S')));
console.log('PT54S ->', parseISODuration('PT54S'), 'Formatted:', formatDuration(parseISODuration('PT54S')));
