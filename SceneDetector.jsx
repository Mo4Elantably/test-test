import React, { useState } from 'react';
import { detectScenes, formatTime, CLIP_COLORS, generateClipId } from '../utils/index.js';
import { Zap, Plus, Loader } from 'lucide-react';

export default function SceneDetector({ videoRef, duration, onAddClips, clipCount }) {
  const [scenes, setScenes] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.12);
  const [selected, setSelected] = useState(new Set());

  const runDetection = async () => {
    const v = videoRef?.current;
    if (!v || !duration) return;
    
    setDetecting(true);
    setScenes([]);
    setProgress(0);
    setSelected(new Set());

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 3, 90));
      }, 200);

      const detected = await detectScenes(v, sensitivity);
      clearInterval(progressInterval);
      setProgress(100);

      // Build segments from scene cuts
      const cuts = [0, ...detected.map(s => s.time), duration];
      const segments = [];
      for (let i = 0; i < cuts.length - 1; i++) {
        const start = cuts[i];
        const end = cuts[i + 1];
        if (end - start >= 1) { // min 1 second
          segments.push({ start, end, confidence: detected[i - 1]?.confidence || 1 });
        }
      }
      setScenes(segments);
    } catch (err) {
      console.error('Scene detection failed', err);
    } finally {
      setDetecting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const toggleScene = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const addSelected = () => {
    const toAdd = [...selected].map(i => {
      const s = scenes[i];
      const colorIdx = (clipCount + i) % CLIP_COLORS.length;
      return {
        id: generateClipId(),
        start: s.start,
        end: s.end,
        label: `Scene ${i + 1}`,
        color: CLIP_COLORS[colorIdx],
        duration: s.end - s.start,
      };
    });
    onAddClips(toAdd);
    setSelected(new Set());
  };

  const selectAll = () => {
    const available = 50 - clipCount;
    setSelected(new Set(scenes.slice(0, available).map((_, i) => i)));
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={14} color="var(--accent3)" />
        <span className="syne" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
          AUTO SCENE DETECT
        </span>
      </div>

      {/* Sensitivity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)' }}>
          <span>SENSITIVITY</span>
          <span style={{ color: 'var(--accent3)' }}>{(sensitivity * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range" min={0.03} max={0.35} step={0.01}
          value={sensitivity}
          onChange={e => setSensitivity(parseFloat(e.target.value))}
          style={{ accentColor: 'var(--accent3)', width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text3)' }}>
          <span>SUBTLE CUTS</span>
          <span>MAJOR CUTS</span>
        </div>
      </div>

      {/* Detect button */}
      <button
        onClick={runDetection}
        disabled={detecting || !duration}
        style={{
          background: detecting ? 'var(--surface2)' : 'var(--accent3)',
          color: detecting ? 'var(--text3)' : '#000',
          border: 'none', borderRadius: '4px', padding: '10px',
          fontFamily: 'Syne', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.15s'
        }}
      >
        {detecting ? (
          <>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ANALYZING... {progress}%
          </>
        ) : (
          <>
            <Zap size={14} />
            DETECT SCENES
          </>
        )}
      </button>

      {/* Progress bar */}
      {detecting && (
        <div style={{ height: '3px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, background: 'var(--accent3)',
            transition: 'width 0.2s', borderRadius: '2px'
          }} />
        </div>
      )}

      {/* Scenes list */}
      {scenes.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
              {scenes.length} SCENES FOUND
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={selectAll}
                style={{
                  background: 'transparent', border: '1px solid var(--border2)',
                  borderRadius: '3px', color: 'var(--text2)', padding: '3px 8px',
                  fontSize: '10px'
                }}>
                ALL
              </button>
              <button
                onClick={() => setSelected(new Set())}
                style={{
                  background: 'transparent', border: '1px solid var(--border2)',
                  borderRadius: '3px', color: 'var(--text2)', padding: '3px 8px',
                  fontSize: '10px'
                }}>
                NONE
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {scenes.map((scene, i) => {
              const isSelected = selected.has(i);
              const dur = scene.end - scene.start;
              return (
                <div
                  key={i}
                  onClick={() => toggleScene(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '5px 8px', borderRadius: '3px', cursor: 'pointer',
                    background: isSelected ? 'rgba(0,212,255,0.1)' : 'var(--surface2)',
                    border: `1px solid ${isSelected ? 'var(--accent3)' : 'var(--border)'}`,
                    transition: 'all 0.1s'
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: '2px', flexShrink: 0,
                    border: `1.5px solid ${isSelected ? 'var(--accent3)' : 'var(--border2)'}`,
                    background: isSelected ? 'var(--accent3)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isSelected && <div style={{ width: 6, height: 6, background: '#000', borderRadius: '1px' }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: '10px', color: 'var(--text2)' }}>Scene {i + 1}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                    {formatTime(scene.start)} → {formatTime(scene.end)}
                  </span>
                  <span style={{
                    fontSize: '10px', color: 'var(--accent3)',
                    background: 'rgba(0,212,255,0.1)', padding: '1px 5px', borderRadius: '2px'
                  }}>
                    {formatTime(dur)}
                  </span>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <button
              onClick={addSelected}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--accent3)',
                borderRadius: '4px', color: 'var(--accent3)', padding: '8px',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
              <Plus size={12} />
              ADD {selected.size} SCENE{selected.size !== 1 ? 'S' : ''} TO DRAFT
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
