import { Song } from '@/types/music';

// Generate a valid WAV file buffer in pure JS
function createWavBlob(durationSeconds: number, generateSamples: (t: number) => [number, number]): Blob {
  const sampleRate = 44100;
  const numChannels = 2;
  const numFrames = Math.floor(sampleRate * durationSeconds);
  const blockAlign = numChannels * 2; // 16-bit stereo
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16 bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    const [left, right] = generateSamples(t);
    
    // Clamp to 16-bit
    const sLeft = Math.max(-1, Math.min(1, left)) * 0x7fff;
    const sRight = Math.max(-1, Math.min(1, right)) * 0x7fff;

    view.setInt16(offset, sLeft, true);
    view.setInt16(offset + 2, sRight, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// 1. Synthwave Demo Beat (Smooth 18s loop)
export function generateSynthwaveDemo(): Song {
  const duration = 18;
  const blob = createWavBlob(duration, (t) => {
    // Chords: Cmaj7 -> Am7 -> Fmaj7 -> G
    const bpm = 110;
    const beatTime = (t * (bpm / 60)) % 16;
    let chordFreqs = [261.63, 329.63, 392.0, 493.88]; // Cmaj7

    if (beatTime >= 4 && beatTime < 8) {
      chordFreqs = [220.0, 261.63, 329.63, 392.0]; // Am7
    } else if (beatTime >= 8 && beatTime < 12) {
      chordFreqs = [174.61, 220.0, 261.63, 329.63]; // Fmaj7
    } else if (beatTime >= 12) {
      chordFreqs = [196.0, 246.94, 293.66, 392.0]; // G7
    }

    // Warm pad chords
    let pad = 0;
    for (const f of chordFreqs) {
      pad += Math.sin(2 * Math.PI * f * t) * 0.08;
      pad += Math.sin(2 * Math.PI * (f * 1.002) * t) * 0.05; // Chorus detune
    }

    // Bassline (8th notes)
    const bassNoteTime = (t * (bpm / 60) * 2) % 1;
    const bassEnv = Math.max(0, 1 - bassNoteTime * 1.5);
    const rootFreq = chordFreqs[0] / 2;
    const bass = (Math.sin(2 * Math.PI * rootFreq * t) + Math.sin(2 * Math.PI * (rootFreq * 2) * t) * 0.3) * bassEnv * 0.25;

    // Soft kick on beats 0, 1, 2, 3
    const kickTime = (t * (bpm / 60)) % 1;
    const kickEnv = Math.max(0, 1 - kickTime * 5);
    const kickFreq = 120 * Math.exp(-kickTime * 20);
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.35;

    // Hi-hat on every 0.5 beat
    const hatTime = (t * (bpm / 60) * 2) % 1;
    const hatEnv = Math.max(0, 1 - hatTime * 12);
    const hatNoise = (Math.random() * 2 - 1) * hatEnv * 0.06;

    const left = pad + bass + kick + hatNoise;
    const right = pad * 0.95 + bass + kick - hatNoise * 0.8;

    return [left * 0.8, right * 0.8];
  });

  return {
    id: `demo_synthwave_${Date.now()}`,
    title: 'Neon Horizon (Demo)',
    artist: 'SonicVault Synth',
    album: 'PWA Demo Essentials',
    duration,
    fileSize: blob.size,
    mimeType: 'audio/wav',
    blob,
    dateAdded: Date.now(),
    playCount: 0,
    favorite: true,
  };
}

// 2. Chill Lo-Fi Demo Beat (Smooth 16s loop)
export function generateLofiDemo(): Song {
  const duration = 16;
  const blob = createWavBlob(duration, (t) => {
    const bpm = 85;
    const chordTime = (t * (bpm / 60)) % 8;
    const freqs = chordTime < 4 ? [293.66, 349.23, 440.0, 523.25] : [261.63, 311.13, 392.0, 466.16]; // Dm9 -> Cm9

    // Electric Piano style EP
    let ep = 0;
    const epTime = (t * (bpm / 60)) % 2;
    const epEnv = Math.max(0, Math.exp(-epTime * 1.8));
    for (const f of freqs) {
      ep += (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 2 * t) * 0.2) * 0.09 * epEnv;
    }

    // Vinyl crackle / tape flutter
    const crackle = (Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.08 : 0);

    // Warm deep kick
    const beat = (t * (bpm / 60)) % 2;
    const kickEnv = beat < 0.2 ? Math.max(0, 1 - beat * 5) : 0;
    const kick = Math.sin(2 * Math.PI * 65 * t) * kickEnv * 0.3;

    // Snare rim on beat 1
    const snareBeat = Math.abs(beat - 1);
    const snareEnv = snareBeat < 0.15 ? Math.max(0, 1 - snareBeat * 8) : 0;
    const snare = ((Math.random() * 2 - 1) * 0.1 + Math.sin(2 * Math.PI * 220 * t) * 0.1) * snareEnv;

    const left = ep + kick + snare + crackle;
    const right = ep * 0.9 + kick + snare - crackle;

    return [left * 0.8, right * 0.8];
  });

  return {
    id: `demo_lofi_${Date.now()}`,
    title: 'Midnight Coffee (Demo)',
    artist: 'Chillout Sessions',
    album: 'PWA Demo Essentials',
    duration,
    fileSize: blob.size,
    mimeType: 'audio/wav',
    blob,
    dateAdded: Date.now() - 1000,
    playCount: 0,
    favorite: false,
  };
}
