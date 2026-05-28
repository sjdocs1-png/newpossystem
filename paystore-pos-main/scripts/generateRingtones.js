// Script to generate audio ringtone files for online orders
// Creates simple MP3 ringtone files in public/sounds/

const fs = require('fs');
const path = require('path');

// Function to create a simple MP3 file with a tone
// This uses a minimal MP3 frame structure with a sine wave
function generateSimpleMP3Tone(frequency = 1000, durationMs = 3000) {
  // This is a very simplified MP3. For production, consider using ffmpeg or a proper library
  // For now, we'll create a WAV file instead which is simpler
  return generateWAVTone(frequency, durationMs);
}

// Function to generate a WAV file with a simple sine wave tone
function generateWAVTone(frequency = 1000, durationMs = 3000) {
  const sampleRate = 44100;
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const amplitude = 32767 * 0.3; // 30% volume to avoid clipping
  
  // WAV header
  const buffer = Buffer.alloc(44 + samples * 2);
  const view = new DataView(buffer.buffer);
  
  // WAV header constants
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const bitDepth = 16;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  
  // Write WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  
  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Generate sine wave samples
  let phase = 0;
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(phase) * amplitude;
    view.setInt16(44 + i * 2, sample, true);
    phase += (2 * Math.PI * frequency) / sampleRate;
  }
  
  return buffer;
}

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log(`Created directory: ${soundsDir}`);
}

// Generate ringtone files
const ringtones = [
  { name: 'ringtone1.wav', frequency: 1000, duration: 3000, description: 'Standard beep' },
  { name: 'ringtone2.wav', frequency: 1500, duration: 3000, description: 'Higher pitch beep' },
  { name: 'ringtone3.wav', frequency: 800, duration: 3000, description: 'Lower pitch beep' },
  { name: 'ringtone4.wav', frequency: 2000, duration: 3000, description: 'High pitch beep' },
  { name: 'ringtone5.wav', frequency: 1000, duration: 2000, description: 'Short beep' },
  { name: 'ringtone6.wav', frequency: 1200, duration: 4000, description: 'Longer beep' },
  { name: 'ringtone7.wav', frequency: 1100, duration: 2500, description: 'Medium beep' },
  { name: 'ringtone8.wav', frequency: 900, duration: 3500, description: 'Deep beep' },
];

ringtones.forEach((ringtone) => {
  const filePath = path.join(soundsDir, ringtone.name);
  const audioBuffer = generateWAVTone(ringtone.frequency, ringtone.duration);
  fs.writeFileSync(filePath, audioBuffer);
  console.log(`✓ Created ${ringtone.name} (${ringtone.description})`);
});

// Also create MP3 aliases (same as WAV for now, but with .mp3 extension)
const mp3Ringtones = [
  { name: 'ringtone1.mp3', frequency: 1000, duration: 3000, description: 'Standard beep' },
];

mp3Ringtones.forEach((ringtone) => {
  const filePath = path.join(soundsDir, ringtone.name);
  const audioBuffer = generateWAVTone(ringtone.frequency, ringtone.duration);
  fs.writeFileSync(filePath, audioBuffer);
  console.log(`✓ Created ${ringtone.name} (${ringtone.description})`);
});

console.log(`\n✅ All ringtone files created in ${soundsDir}`);
console.log('\nTo use in HTML:');
console.log('  <audio src="/sounds/ringtone1.mp3"></audio>');
