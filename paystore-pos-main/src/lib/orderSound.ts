/**
 * Global Order Sound Utility
 * 
 * Uses a single HTML audio element (id="order-audio") for playing order notifications.
 * Audio must be unlocked on first user interaction (browser autoplay policy).
 */

const RINGTONE_CONFIG: Record<string, { freq: number; duration: number }> = {
  'ringtone1.wav': { freq: 1000, duration: 3000 },
  'ringtone2.wav': { freq: 1500, duration: 3000 },
  'ringtone3.wav': { freq: 800, duration: 3000 },
  'ringtone4.wav': { freq: 2000, duration: 3000 },
  'ringtone5.wav': { freq: 1000, duration: 2000 },
  'ringtone6.wav': { freq: 1200, duration: 4000 },
  'ringtone7.wav': { freq: 1100, duration: 2500 },
  'ringtone8.wav': { freq: 900, duration: 3500 },
  'ringtone9.wav': { freq: 1600, duration: 2500 },
  'ringtone10.wav': { freq: 1400, duration: 2000 },
  'ringtone11.wav': { freq: 1800, duration: 3500 },
  'ringtone12.wav': { freq: 880, duration: 2500 },
};

// Fallback tone data URI for when loading fails
const FALLBACK_WAV_DATA_URI = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';

function generateWavDataUri(frequency = 1000, duration = 3000): string {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * (duration / 1000));
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;

  const wavData = new Uint8Array(44 + samples * bytesPerSample);
  const view = new DataView(wavData.buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * bytesPerSample, true);

  let phase = 0;
  const amplitude = 32767 * 0.3;
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(phase) * amplitude;
    view.setInt16(44 + i * bytesPerSample, sample, true);
    phase += (2 * Math.PI * frequency) / sampleRate;
  }

  let binary = '';
  for (let i = 0; i < wavData.byteLength; i++) {
    binary += String.fromCharCode(wavData[i]);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function getAudioSource(selectedRingtone: string, customSoundUrl?: string | null): string {
  if (selectedRingtone === 'custom' && customSoundUrl) {
    return customSoundUrl;
  }

  const ringtoneConfig = RINGTONE_CONFIG[selectedRingtone] || RINGTONE_CONFIG['ringtone1.wav'];
  return generateWavDataUri(ringtoneConfig.freq, ringtoneConfig.duration);
}

function getAudioElement(): HTMLAudioElement | null {
  return document.getElementById('order-audio') as HTMLAudioElement | null;
}

export function setOrderSoundSource(selectedRingtone: string, customSoundUrl: string | null = null, volume = 1): void {
  const audio = getAudioElement();
  if (!audio) {
    console.warn('[orderSound] Audio element not found for source update');
    return;
  }

  const source = getAudioSource(selectedRingtone, customSoundUrl);
  audio.src = source;
  audio.volume = Math.max(0, Math.min(volume, 1));
  audio.preload = 'auto';
  audio.load();
  console.log('[orderSound] Audio source set', selectedRingtone, customSoundUrl ? 'custom' : 'default');
}

export function playOrderSound(): void {
  const audio = getAudioElement();
  if (!audio) {
    console.error('[orderSound] Audio element not found (id="order-audio")');
    return;
  }

  try {
    if (!audio.src || audio.src.includes('undefined')) {
      audio.src = FALLBACK_WAV_DATA_URI;
      audio.load();
    }

    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error('[orderSound] Play failed:', error?.message || error);
        if (!audio.src.startsWith('data:')) {
          audio.src = FALLBACK_WAV_DATA_URI;
          audio.load();
          audio.play().catch((fallbackError) => {
            console.error('[orderSound] Fallback also failed:', fallbackError?.message || fallbackError);
          });
        }
      });
    }
  } catch (error) {
    console.error('[orderSound] Play error:', error);
  }
}

export function stopOrderSound(): void {
  const audio = getAudioElement();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    console.log('[orderSound] Sound stopped');
  }
}

export function unlockAudioContext(): void {
  const audio = getAudioElement();
  if (!audio) {
    console.warn('[orderSound] Audio element not found for unlock');
    return;
  }

  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      console.log('[orderSound] Audio context unlocked ✓');
    })
    .catch(() => {
      console.log('[orderSound] Audio unlock attempt (may be blocked by browser)');
    });
}
