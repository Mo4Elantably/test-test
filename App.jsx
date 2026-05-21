import React, { useState, useRef, useCallback } from 'react';
import VideoLoader from './components/VideoLoader.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import ClipEditor from './components/ClipEditor.jsx';
import DraftBoard from './components/DraftBoard.jsx';
import SceneDetector from './components/SceneDetector.jsx';
import VideoInfo from './components/VideoInfo.jsx';
import { Plus } from 'lucide-react';

export default function App() {
  const videoRef = useRef(null);
  const [videoSource, setVideoSource] = useState(null); // { src, name, type, ytId? }
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState(null); // { start, end }
  const [clips, setClips] = useState([]);
  const [activePanel, setActivePanel] = useState('cut'); // 'cut' | 'scene'

  const handleLoad = useCallback((meta) => {
    setVideoSource(meta);
    setClips([]);
    setSelection(null);
    setDuration(0);
  }, []);

  const handleClose = () => {
    setVideoSource(null);
    setClips([]);
    setSelection(null);
    setDuration(0);
    if (videoRef.current) videoRef.current.src = '';
  };

  const handleAddClip = (clip) => {
    setClips(prev => prev.length < 50 ? [...prev, clip] : prev);
  };

  const handleAddClips = (newClips) => {
    setClips(prev => {
      const available = 50 - prev.length;
      return [...prev, ...newClips.slice(0, available)];
    });
  };

  const handleRemoveClip = (id) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleReorder = (newClips) => setClips(newClips);

  const handleLabelChange = (id, label) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, label } : c));
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  // YouTube embed src
  const isYT = videoSource?.type === 'youtube';
  const ytSrc = isYT
    ? `https://www.youtube.com/embed/${videoSource.ytId}?enablejsapi=1`
    : null;

  if (!videoSource) {
    return <VideoLoader onLoad={handleLoad} />;
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      {/* Top bar */}
      <div style={{
        height: '48px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px',
        background: 'var(--surface)', flexShrink: 0
      }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '16px', color: 'var(--accent)', letterSpacing: '-0.01em' }}>
          CLIP<span style={{ color: 'var(--text)' }}>FORGE</span>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
          {videoSource.name}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: clips.length >= 50 ? 'var(--accent2)' : 'var(--text3)' }}>
          {clips.length}/50 clips in draft
        </span>
        <button
          onClick={handleClose}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '3px', color: 'var(--text2)', padding: '5px 12px', fontSize: '11px'
          }}>
          ← NEW VIDEO
        </button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Video + Player */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '12px', gap: '12px', minWidth: 0, overflow: 'hidden'
        }}>
          {/* YouTube embed OR native player */}
          {isYT ? (
            <div style={{ flex: 1, background: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', minHeight: 0 }}>
              <iframe
                src={ytSrc}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div style={{ padding: '10px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
                  ⚠️ YouTube videos can be previewed here but clipping requires a local file download first
                </div>
              </div>
            </div>
          ) : (
            <VideoPlayer
              src={videoSource.src}
              videoRef={videoRef}
              clips={clips}
              activeSelection={selection}
              onSelectionChange={setSelection}
              onTimeUpdate={setCurrentTime}
              duration={duration}
              onDurationChange={setDuration}
            />
          )}
        </div>

        {/* Right: Tools + Draft */}
        <div style={{
          width: '360px', display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid var(--border)', minHeight: 0, overflow: 'hidden'
        }}>
          {/* Panel tabs */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)', flexShrink: 0
          }}>
            {[
              { id: 'cut', label: '✂️ CUT' },
              { id: 'scene', label: '⚡ SCENES' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                style={{
                  flex: 1, padding: '10px 8px',
                  background: 'transparent',
                  color: activePanel === tab.id ? 'var(--accent)' : 'var(--text3)',
                  borderBottom: activePanel === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em',
                  transition: 'all 0.15s'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool panels */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexShrink: 0 }}>
            {activePanel === 'cut' && (
              <ClipEditor
                duration={duration}
                currentTime={currentTime}
                selection={selection}
                onSelectionChange={setSelection}
                onAddClip={handleAddClip}
                clipCount={clips.length}
                onSeek={handleSeek}
              />
            )}
            {activePanel === 'scene' && (
              <SceneDetector
                videoRef={videoRef}
                duration={duration}
                onAddClips={handleAddClips}
                clipCount={clips.length}
              />
            )}
          </div>

          {/* Draft board */}
          <div style={{ flex: 1, minHeight: 0, padding: '0 12px 12px', display: 'flex', flexDirection: 'column' }}>
            <DraftBoard
              clips={clips}
              onRemove={handleRemoveClip}
              onReorder={handleReorder}
              onSeek={handleSeek}
              onLabelChange={handleLabelChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
