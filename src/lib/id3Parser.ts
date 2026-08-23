import { Song } from '@/types/music';

// Helper to sanitize filename into Title and Artist
export function parseFilename(filename: string): { title: string; artist: string } {
  // Strip extension (.mp3, .wav, etc.)
  const base = filename.replace(/\.[^/.]+$/, '');
  
  if (base.includes(' - ')) {
    const parts = base.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  } else if (base.includes('_-_')) {
    const parts = base.split('_-_');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join('_-_').trim(),
    };
  }
  
  return {
    artist: 'Unknown Artist',
    title: base.trim(),
  };
}

// Extract duration accurately using HTML5 Audio metadata
export function getAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(0);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const url = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    
    audio.src = url;
  });
}

// Convert byte array or slice to Base64 image
function bufferToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType || 'image/jpeg'};base64,${base64}`;
}

// Decode Synchsafe integer (used in ID3v2 headers)
function decodeSynchsafe(b0: number, b1: number, b2: number, b3: number): number {
  return (b0 << 21) | (b1 << 14) | (b2 << 7) | b3;
}

// Pure JS ID3v2.3 & ID3v2.4 Tag Parser (Zero external dependency)
export async function parseID3Tags(file: Blob): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
}> {
  return new Promise((resolve) => {
    // Read the first 128KB of the file (sufficient for ID3v2 tags & album art)
    const slice = file.slice(0, 131072);
    const reader = new FileReader();

    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      if (!buffer || buffer.byteLength < 10) {
        return resolve({});
      }

      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);

      // Check ID3 magic bytes ('I', 'D', '3')
      if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
        return resolve({});
      }

      const versionMajor = bytes[3]; // 3 for ID3v2.3, 4 for ID3v2.4
      const tagSize = decodeSynchsafe(bytes[6], bytes[7], bytes[8], bytes[9]);
      const maxOffset = Math.min(tagSize + 10, buffer.byteLength);

      let offset = 10;
      let title: string | undefined;
      let artist: string | undefined;
      let album: string | undefined;
      let coverArt: string | undefined;

      while (offset + 10 < maxOffset) {
        // Read Frame ID (4 chars)
        let frameId = '';
        for (let i = 0; i < 4; i++) {
          const charCode = bytes[offset + i];
          if (charCode >= 32 && charCode <= 126) {
            frameId += String.fromCharCode(charCode);
          }
        }

        if (frameId.length < 4 || bytes[offset] === 0) {
          // Reached padding
          break;
        }

        let frameSize = 0;
        if (versionMajor === 4) {
          frameSize = decodeSynchsafe(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
        } else {
          frameSize = view.getUint32(offset + 4, false);
        }

        if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) {
          break;
        }

        const frameDataOffset = offset + 10;
        const frameData = bytes.subarray(frameDataOffset, frameDataOffset + frameSize);

        // Decode text frames
        if (frameId === 'TIT2' || frameId === 'TPE1' || frameId === 'TALB') {
          try {
            const encoding = frameData[0];
            let text = '';
            const textBytes = frameData.subarray(1);

            if (encoding === 0 || encoding === 3) {
              // ISO-8859-1 or UTF-8
              const decoder = new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1');
              text = decoder.decode(textBytes).replace(/\0+$/, '');
            } else if (encoding === 1 || encoding === 2) {
              // UTF-16
              const decoder = new TextDecoder('utf-16');
              text = decoder.decode(textBytes).replace(/\0+$/, '');
            }

            if (frameId === 'TIT2' && text.trim()) title = text.trim();
            if (frameId === 'TPE1' && text.trim()) artist = text.trim();
            if (frameId === 'TALB' && text.trim()) album = text.trim();
          } catch {
            // ignore decode error
          }
        }

        // Decode APIC (Attached Picture) frame
        if (frameId === 'APIC' && !coverArt) {
          try {
            const encoding = frameData[0];
            let pos = 1;

            // Read MIME type
            let mimeType = '';
            while (pos < frameData.length && frameData[pos] !== 0) {
              mimeType += String.fromCharCode(frameData[pos]);
              pos++;
            }
            pos++; // Skip 0 byte

            // Picture type (1 byte)
            const picType = frameData[pos];
            pos++;

            // Skip description string
            if (encoding === 1 || encoding === 2) {
              while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
                pos += 2;
              }
              pos += 2;
            } else {
              while (pos < frameData.length && frameData[pos] !== 0) {
                pos++;
              }
              pos++;
            }

            if (pos < frameData.length) {
              const imgBytes = frameData.subarray(pos);
              coverArt = bufferToDataUrl(imgBytes, mimeType || 'image/jpeg');
            }
          } catch {
            // ignore artwork decode error
          }
        }

        offset += 10 + frameSize;
      }

      resolve({ title, artist, album, coverArt });
    };

    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(slice);
  });
}

// Master function to parse File into full Song object
export async function parseAudioFile(file: File): Promise<Song> {
  const fileParsed = parseFilename(file.name);
  let title = fileParsed.title;
  let artist = fileParsed.artist;
  let album = 'Sonic Vault';
  let coverArt: string | undefined = undefined;
  let duration = 0;

  try {
    const durationPromise = getAudioDuration(file);
    const id3Promise = parseID3Tags(file);
    const [dur, tags] = await Promise.all([durationPromise, id3Promise]);

    if (dur > 0) duration = dur;
    if (tags.title) title = tags.title;
    if (tags.artist) artist = tags.artist;
    if (tags.album) album = tags.album;
    if (tags.coverArt) coverArt = tags.coverArt;
  } catch (err) {
    console.warn('ID3 parsing skipped, using filename info:', err);
  }

  const id = `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const song: Song = {
    id,
    title,
    artist,
    album,
    duration: Math.round(duration),
    fileSize: file.size,
    mimeType: file.type || 'audio/mpeg',
    coverArt,
    blob: file, // Stored in IndexedDB
    dateAdded: Date.now(),
    playCount: 0,
    favorite: false,
  };

  return song;
}
