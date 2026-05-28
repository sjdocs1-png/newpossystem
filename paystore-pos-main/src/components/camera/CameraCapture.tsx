import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export const CameraCapture: React.FC<{ onClose: () => void; onCapture: (file: File) => void; constraints?: MediaStreamConstraints }> = ({ onClose, onCapture, constraints }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia(constraints || { video: { facingMode: 'environment' } });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error('Camera error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) return;
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-card p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Capture Photo</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="bg-black rounded overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Initializing camera…</div>
          ) : (
            <video ref={videoRef} className="w-full h-auto" playsInline />
          )}
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <Button onClick={handleCapture}>Capture</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
