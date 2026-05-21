import React from 'react';
import { formatTime } from '../utils/index.js';
import { Film, X } from 'lucide-react';

export default function VideoInfo({ videoMeta, onClose }) {
  if (!videoMeta) return null;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '4px', padding: '12px 14px', display: 'flex',
      alignItems: 'center', gap: '10px', flexShrink: 0
    }}>
      <Film size={14} color="var(--text3)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px', color: 'var(--text)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500
        }}>
          {videoMeta.name}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', display: 'flex', gap: '12px' }}>
          {videoMeta.duration && <span>⏱ {formatTime(videoMeta.duration)}</span>}
          {videoMeta.type && <span>📁 {videoMeta.type.toUpperCase()}</span>}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent', color: 'var(--text3)',
          padding: '4px', borderRadius: '3px'
        }}>
        <X size={13} />
      </button>
    </div>
  );
}
