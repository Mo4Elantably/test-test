import React, { useState, useRef } from 'react';
import { Upload, Link, X, AlertCircle } from 'lucide-react';

export default function VideoLoader({ onLoad }) {
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const fileRef = useRef(null);

  const loadFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }
    const url = URL.createObjectURL(file);
    onLoad({ src: url, name: file.name, type: 'local' });
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    loadFile(file);
  };

  const handleUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    
    // Detect YouTube
    if (/youtube\.com|youtu\.be/.test(url)) {
      const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (m) {
        onLoad({ src: url, name: url, type: 'youtube', ytId: m[1] });
        setError('');
        return;
      }
    }
    
    // Direct video URL
    onLoad({ src: url, name: url.split('/').pop() || 'video', type: 'url' });
    setError('');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div style={{
        width: '100%', maxWidth: 520, padding: '0 24px',
        position: 'relative', animation: 'fadeIn 0.4s ease'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Syne', fontSize: '42px', fontWeight: 800,
            color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1
          }}>
            CLIP
          </div>
          <div style={{
            fontFamily: 'Syne', fontSize: '42px', fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1
          }}>
            FORGE
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', letterSpacing: '0.15em' }}>
            VIDEO CUTTING STUDIO
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--surface2)', borderRadius: '4px',
          padding: '3px', marginBottom: '16px', border: '1px solid var(--border)'
        }}>
          {['upload', 'url'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text2)',
                border: 'none', borderRadius: '3px',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.1em', transition: 'all 0.15s'
              }}>
              {m === 'upload' ? '↑ LOCAL FILE' : '🔗 URL / YOUTUBE'}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: '4px', padding: '48px 24px',
              textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? 'rgba(232,255,0,0.04)' : 'var(--surface)',
              transform: dragging ? 'scale(1.01)' : 'scale(1)'
            }}
          >
            <Upload size={32} color={dragging ? 'var(--accent)' : 'var(--text3)'}
              style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', marginBottom: 6 }}>
              DROP VIDEO HERE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
              or click to browse · MP4, MOV, AVI, MKV, WebM
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={e => loadFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: '4px', display: 'flex', overflow: 'hidden'
            }}>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrl()}
                placeholder="https://youtube.com/watch?v=... or direct video URL"
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: 'var(--text)', padding: '12px 14px', fontSize: '13px'
                }}
              />
              {urlInput && (
                <button
                  onClick={() => setUrlInput('')}
                  style={{ background: 'transparent', color: 'var(--text3)', padding: '0 12px' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleUrl}
              disabled={!urlInput.trim()}
              style={{
                background: urlInput.trim() ? 'var(--accent)' : 'var(--surface2)',
                color: urlInput.trim() ? '#000' : 'var(--text3)',
                border: 'none', borderRadius: '4px', padding: '12px',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
              <Link size={14} />
              LOAD VIDEO
            </button>

            <div style={{
              background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '3px', padding: '8px 12px', fontSize: '10px', color: 'var(--text3)', lineHeight: 1.5
            }}>
              ℹ️ YouTube links show an embedded player (cutting requires local file). Direct .mp4/.webm URLs work fully.
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--accent2)', fontSize: '12px'
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
