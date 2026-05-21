export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function parseTime(str) {
  if (!str) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return Number(parts[0]) || 0;
}

export function isValidTimeString(str) {
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(str.trim());
}

export const CLIP_COLORS = [
  '#e8ff00', '#ff4d00', '#00d4ff', '#ff00aa', '#00ff88',
  '#ff8800', '#a855f7', '#06b6d4', '#f43f5e', '#84cc16'
];

export function generateClipId() {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

export function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Detect "scenes" by sampling video frames and measuring brightness/color variance
// Returns array of { time, confidence }
export async function detectScenes(videoEl, sensitivity = 0.15) {
  if (!videoEl || !videoEl.duration) return [];
  
  const duration = videoEl.duration;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');
  
  const sampleInterval = Math.max(1, duration / 120); // up to 120 samples
  const scenes = [];
  let prevData = null;
  
  const seekAndCapture = (time) => new Promise((resolve) => {
    videoEl.currentTime = time;
    const handler = () => {
      videoEl.removeEventListener('seeked', handler);
      ctx.drawImage(videoEl, 0, 0, 64, 36);
      const imageData = ctx.getImageData(0, 0, 64, 36).data;
      resolve(imageData);
    };
    videoEl.addEventListener('seeked', handler);
  });

  for (let t = 0; t < duration; t += sampleInterval) {
    const data = await seekAndCapture(t);
    if (prevData) {
      let diff = 0;
      for (let i = 0; i < data.length; i += 4) {
        diff += Math.abs(data[i] - prevData[i]);
        diff += Math.abs(data[i+1] - prevData[i+1]);
        diff += Math.abs(data[i+2] - prevData[i+2]);
      }
      const normalized = diff / (64 * 36 * 3 * 255);
      if (normalized > sensitivity) {
        scenes.push({ time: t, confidence: Math.min(1, normalized / (sensitivity * 2)) });
      }
    }
    prevData = data;
  }
  
  return scenes;
}
