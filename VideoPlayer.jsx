import React, { useRef, useEffect, useState, useCallback } from 'react';
import { formatTime, clamp } from '../utils/index.js';
import { Play, Pause, Volume2, VolumeX, Maximize2, Scissors } from 'lucide-react';

export default function VideoPlayer({
  src,
  videoRef: externalRef,
  clips,
  activeSelection,
  onSelectionChange,
  onTimeUpdate,
  duration,
  onDurationChange,
}) {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const timelineRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [dragging, setDragging] = useState(null); // 'seek' | 'start' | 'end'
  const [hoverTime, setHoverTime] = useState(null);
  const [selectionDrag, setSelectionDrag] = useState(null);

  const handleTimeUpdate = useCallback(() => {
    const t = videoRef.current?.currentTime || 0;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  }, [onTimeUpdate]);

  const handleDurationChange = useCallback(() => {
    const d = videoRef.current?.duration || 0;
    onDurationChange?.(d);
  }, [onDurationChange]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('durationchange', handleDurationChange);
    v.addEventListener('play', () => setPlaying(true));
    v.addEventListener('pause', () => setPlaying(false));
    v.addEventListener('ended', () => setPlaying(false));
    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('durationchange', handleDurationChange);
    };
  }, [src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause(); else v.play();
  };

  const getTimeFromEvent = useCallback((e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    return (x / rect.width) * (duration || 1);
  }, [duration]);

  const handleTimelineMouseDown = useCallback((e) => {
    if (!duration) return;
    const t = getTimeFromEvent(e);
    
    // Check if near selection handles
    if (activeSelection) {
      const startPct = activeSelection.start / duration;
      const endPct = activeSelection.end / duration;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPct = (e.clientX - rect.left) / rect.width;
      
      if (Math.abs(clickPct - startPct) < 0.015) {
        setDragging('start');
        return;
      }
      if (Math.abs(clickPct - endPct) < 0.015) {
        setDragging('end');
        return;
      }
      // Click inside selection area: move playhead
      if (clickPct > startPct && clickPct < endPct) {
        videoRef.current.currentTime = t;
        setDragging('seek');
        return;
      }
    }
    
    // Start new selection drag
    setSelectionDrag(t);
    onSelectionChange?.({ start: t, end: t });
    setDragging('newSelection');
  }, [duration, activeSelection, getTimeFromEvent]);

  const handleTimelineMouseMove = useCallback((e) => {
    if (!duration) return;
    const t = getTimeFromEvent(e);
    setHoverTime(t);
    
    if (!dragging) return;
    
    if (dragging === 'seek') {
      videoRef.current.currentTime = t;
    } else if (dragging === 'start' && activeSelection) {
      onSelectionChange?.({ ...activeSelection, start: clamp(t, 0, activeSelection.end - 0.5) });
    } else if (dragging === 'end' && activeSelection) {
      onSelectionChange?.({ ...activeSelection, end: clamp(t, activeSelection.start + 0.5, duration) });
    } else if (dragging === 'newSelection' && selectionDrag !== null) {
      const s = Math.min(selectionDrag, t);
      const e2 = Math.max(selectionDrag, t);
      onSelectionChange?.({ start: s, end: e2 });
    }
  }, [dragging, duration, activeSelection, selectionDrag, getTimeFromEvent]);

  const handleTimelineMouseUp = useCallback((e) => {
    if (dragging === 'seek' || dragging === 'newSelection') {
      const t = getTimeFromEvent(e);
      if (dragging === 'seek') videoRef.current.currentTime = t;
    }
    setDragging(null);
    setSelectionDrag(null);
  }, [dragging, getTimeFromEvent]);

  const handleSeekClick = (e) => {
    if (!duration || dragging) return;
    const t = getTimeFromEvent(e);
    videoRef.current.currentTime = t;
  };

  const playPct = duration ? currentTime / duration : 0;
  const selStart = activeSelection && duration ? activeSelection.start / duration : null;
  const selEnd = activeSelection && duration ? activeSelection.end / duration : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {/* Video */}
      <div style={{
        flex: 1, background: '#000', borderRadius: '4px', overflow: 'hidden',
        border: '1px solid var(--border)', position: 'relative', minHeight: 0
      }}>
        {src ? (
          <video
            ref={videoRef}
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onClick={togglePlay}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text3)', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ fontSize: '40px' }}>🎬</div>
            <div style={{ fontFamily: 'Syne', fontSize: '13px', letterSpacing: '0.1em' }}>NO SOURCE LOADED</div>
          </div>
        )}
        {/* Play overlay */}
        {src && !playing && (
          <div onClick={togglePlay} style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(0,0,0,0.3)', cursor: 'pointer'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(232,255,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Play size={22} color="#000" fill="#000" style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Timeline */}
        <div
          ref={timelineRef}
          style={{
            height: '48px', background: 'var(--surface2)', borderRadius: '4px',
            position: 'relative', cursor: 'crosshair', border: '1px solid var(--border)',
            overflow: 'visible', userSelect: 'none'
          }}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={() => { setHoverTime(null); if (dragging) { setDragging(null); setSelectionDrag(null); } }}
        >
          {/* Existing clips */}
          {clips?.map((clip, i) => {
            if (!duration) return null;
            const s = (clip.start / duration) * 100;
            const w = ((clip.end - clip.start) / duration) * 100;
            return (
              <div key={clip.id} style={{
                position: 'absolute', top: 0, height: '100%',
                left: `${s}%`, width: `${w}%`,
                background: (clip.color || '#e8ff00') + '33',
                borderLeft: `2px solid ${clip.color || '#e8ff00'}`,
                borderRight: `2px solid ${clip.color || '#e8ff00'}`,
                pointerEvents: 'none'
              }} />
            );
          })}

          {/* Active selection */}
          {selStart !== null && selEnd !== null && (
            <>
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: `${selStart * 100}%`,
                width: `${(selEnd - selStart) * 100}%`,
                background: 'rgba(232,255,0,0.15)',
                border: '2px solid var(--accent)',
                pointerEvents: 'none'
              }} />
              {/* Handles */}
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: `${selStart * 100}%`, width: '4px',
                background: 'var(--accent)', cursor: 'ew-resize',
                transform: 'translateX(-2px)', zIndex: 10
              }} />
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: `${selEnd * 100}%`, width: '4px',
                background: 'var(--accent)', cursor: 'ew-resize',
                transform: 'translateX(-2px)', zIndex: 10
              }} />
              {/* Selection time label */}
              <div style={{
                position: 'absolute', top: '-22px',
                left: `${((selStart + selEnd) / 2) * 100}%`,
                transform: 'translateX(-50%)',
                background: 'var(--accent)', color: '#000',
                fontSize: '10px', padding: '1px 6px', borderRadius: '2px',
                fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none'
              }}>
                {formatTime(activeSelection.start)} → {formatTime(activeSelection.end)} ({formatTime(activeSelection.end - activeSelection.start)})
              </div>
            </>
          )}

          {/* Playhead */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: '2px',
            background: '#fff', left: `${playPct * 100}%`,
            pointerEvents: 'none', zIndex: 20
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 10, height: 10, background: '#fff', borderRadius: '50%'
            }} />
          </div>

          {/* Hover time */}
          {hoverTime !== null && !dragging && (
            <div style={{
              position: 'absolute', bottom: '-20px',
              left: `${(hoverTime / (duration || 1)) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '10px', color: 'var(--text2)', pointerEvents: 'none'
            }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={togglePlay} style={{
            background: 'var(--accent)', color: '#000', border: 'none',
            width: 36, height: 36, borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <span style={{ fontSize: '11px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>

          <div style={{ flex: 1 }} />

          <button onClick={() => { setMuted(!muted); videoRef.current.muted = !muted; }}
            style={{ background: 'transparent', color: 'var(--text2)', padding: '4px' }}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <input
            type="range" min={0} max={1} step={0.01}
            value={muted ? 0 : volume}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              videoRef.current.volume = v;
              if (v > 0) setMuted(false);
            }}
            style={{ width: '72px', accentColor: 'var(--accent)' }}
          />

          {/* Speed */}
          {[0.5, 1, 1.5, 2].map(s => (
            <button key={s} onClick={() => { videoRef.current.playbackRate = s; }}
              style={{
                background: 'var(--surface2)', color: 'var(--text2)',
                border: '1px solid var(--border)', padding: '3px 7px',
                borderRadius: '3px', fontSize: '11px'
              }}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
