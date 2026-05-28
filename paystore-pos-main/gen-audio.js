// Generate proper WAV audio file and save to public/sounds
const fs = require('fs');
const path = require('path');

// Generate WAV file with tone
function generateWAV(freq = 1000, duration = 3000, volume = 0.3) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * (duration / 1000));
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;

  // Create buffer for WAV file
  const wavData = Buffer.alloc(44 + samples * 2);

  // Write WAV header
  const view = new DataView(wavData.buffer, 0, 44);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Chunk ID "RIFF"
  writeString(0, 'RIFF');
  // File size - 8
  view.setUint32(4, wavData.length - 8, true);
  // Format "WAVE"
  writeString(8, 'WAVE');

  // Subchunk1 ID "fmt "
  writeString(12, 'fmt ');
  // Subchunk1 size
  view.setUint32(16, 16, true);
  // Audio format (1 = PCM)
  view.setUint16(20, 1, true);
  // Num channels
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, sampleRate * blockAlign, true);
  // Block align
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, 16, true);

  // Subchunk2 ID "data"
  writeString(36, 'data');
  // Subchunk2 size
  view.setUint32(40, samples * 2, true);

  // Generate sine wave samples
  const max = 32767;
  let phase = 0;
  const dv = new DataView(wavData.buffer, 44);
  
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(phase) * max * volume;
    dv.setInt16(i * 2, sample, true);
    phase += (freq / sampleRate) * 2 * Math.PI;
  }

  return wavData;
}

// Ensure directory exists
const soundsDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✓ Created sounds directory');
}

// Generate and save ringtone files
const ringtones = [
  { file: 'ringtone1.wav', freq: 1000, dur: 3000, desc: 'Standard beep' },
  { file: 'ringtone2.wav', freq: 1500, dur: 3000, desc: 'High beep' },
  { file: 'ringtone3.wav', freq: 800, dur: 3000, desc: 'Low beep' },
];

ringtones.forEach(({ file, freq, dur, desc }) => {
  const wavBuffer = generateWAV(freq, dur);
  const filePath = path.join(soundsDir, file);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`✓ Created ${file} (${desc}) - ${wavBuffer.length} bytes`);
});

// Also create .mp3 extension versions (same WAV format)
ringtones.forEach(({ file, freq, dur }) => {
  const wavBuffer = generateWAV(freq, dur);
  const mp3File = file.replace('.wav', '.mp3');
  const filePath = path.join(soundsDir, mp3File);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`✓ Created ${mp3File} (as WAV) - ${wavBuffer.length} bytes`);
});

console.log('\n✅ All audio files created in public/sounds/');
console.log('Files can now be accessed at: /sounds/ringtone1.mp3, /sounds/ringtone1.wav, etc.');
