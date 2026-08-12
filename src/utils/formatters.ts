// Format seconds to HH:MM:SS or MM:SS
export function formatTime(seconds: number, showMilliseconds = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const pad = (num: number) => num.toString().padStart(2, '0');

  let result = '';
  if (hrs > 0) {
    result = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  } else {
    result = `${pad(mins)}:${pad(secs)}`;
  }

  if (showMilliseconds) {
    result += `.${pad(ms)}`;
  }

  return result;
}

// Format bytes into human readable KB / MB / GB
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Generate thumbnail image from video blob
export function generateVideoThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(blob);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to 0.5s or start
      video.currentTime = Math.min(1, video.duration / 2 || 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(dataUrl);
      } else {
        URL.revokeObjectURL(video.src);
        resolve('');
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve('');
    };

    // Timeout fallback
    setTimeout(() => {
      if (video.src) URL.revokeObjectURL(video.src);
      resolve('');
    }, 3000);
  });
}
