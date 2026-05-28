#!/usr/bin/env node
const fs = require('fs');

// Simple WAV file generator
function createWavFile(filename, frequency = 1000, durationMs = 3000) {
  const sampleRate = 44100;
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const amplitude = 32767 * 0.3;
  
  const buffer = Buffer.alloc(44 + samples * 2);
  const view = new DataView(buffer.buffer);
  
  // WAV header
  buffer.write('RIFF', 0);
  view.setUint32(4, 36 + samples * 2, true);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  buffer.write('data', 36);
  view.setUint32(40, samples * 2, true);
  
  // Generate sine wave
  let phase = 0;
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(phase) * amplitude;
    view.setInt16(44 + i * 2, sample, true);
    phase += (2 * Math.PI * frequency) / sampleRate;
  }
  
  fs.writeFileSync(filename, buffer);
}

const soundsDir = 'public/sounds';
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const files = [
  ['public/sounds/ringtone1.mp3', 1000, 3000],
  ['public/sounds/ringtone2.mp3', 1500, 3000],
  ['public/sounds/ringtone3.mp3', 800, 3000],
];

files.forEach(([file, freq, dur]) => {
  createWavFile(file, freq, dur);
  console.log(`Created ${file}`);
});

console.log('Done!');
