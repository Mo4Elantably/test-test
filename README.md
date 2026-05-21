# 🎬 ClipForge — Video Cutting Studio

A browser-based video cutting tool that lets you:

- **Load videos** from local files or URLs (YouTube embed preview)
- **Cut clips** by typing timestamps (HH:MM:SS) or dragging the timeline
- **Auto-detect scenes** with adjustable sensitivity
- **Build a draft** of up to 50 clips, drag to reorder, rename any clip
- **Export** as JSON or FFmpeg shell script to extract clips

## Deploy in 30 seconds

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
Connect your GitHub repo in Cloudflare dashboard:
- Build command: `npm run build`
- Output dir: `dist`

### Local dev
```bash
npm install
npm run dev
```

## How to use

1. Drop a video file or paste a URL
2. **Timeline**: drag on the timeline to select a clip range
3. **Clip Cutter**: fine-tune timestamps, label the clip, click ADD TO DRAFT
4. **Scene Detect**: run auto-detection to find cuts automatically
5. **Draft Board**: reorder clips via drag-and-drop, rename, preview
6. **Export**: download FFmpeg script to extract all clips from your original video

## Export clips (FFmpeg)
After exporting the shell script:
```bash
chmod +x clipforge-export.sh
# Edit the file to set INPUT.mp4 to your actual video filename
./clipforge-export.sh
```
