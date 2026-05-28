export async function addImageWatermark(file: File, watermarkText: string, options?: { font?: string; color?: string; scale?: number }) {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });

  const scale = options?.scale || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const font = options?.font || '20px Arial';
  const color = options?.color || 'rgba(255,255,255,0.9)';
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'bottom';

  const padding = 10;
  const lines = (watermarkText || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const x = canvas.width - padding;
    const y = canvas.height - padding - (lines.length - 1 - i) * 22;
    ctx.textAlign = 'right';
    ctx.fillText(text, x, y);
  }

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, file.type || 'image/jpeg', 0.9));
  if (!blob) throw new Error('Failed to generate watermarked image');

  const newFile = new File([blob], file.name, { type: blob.type });
  URL.revokeObjectURL(url);
  return newFile;
}

export async function capturePhotoFromCamera(constraints: MediaStreamConstraints = { video: { facingMode: 'environment' } }) {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const video = document.createElement('video');
  video.autoplay = true;
  video.srcObject = stream;
  await new Promise((res) => (video.onloadedmetadata = res));

  // Capture a single frame
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Stop tracks
  stream.getTracks().forEach((t) => t.stop());

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Capture failed');
  const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return file;
}
