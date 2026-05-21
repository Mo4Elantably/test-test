import React, { useState } from 'react';
import { formatTime, downloadJSON } from '../utils/index.js';
import { Trash2, Download, GripVertical, Play, Edit2, Check, X, FileDown } from 'lucide-react';

export default function DraftBoard({ clips, onRemove, onReorder, onSeek, onLabelChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [dragOver, setDragOver] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const totalDuration = clips.reduce((a, c) => a + (c.end - c.start), 0);

  const handleDragStart = (e, idx) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const newClips = [...clips];
    const [moved] = newClips.splice(draggingIdx, 1);
    newClips.splice(idx, 0, moved);
    onReorder(newClips);
    setDragOver(null);
    setDraggingIdx(null);
  };

  const handleDragEnd = () => {
    setDragOver(null);
    setDraggingIdx(null);
  };

  const exportDraft = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalClips: clips.length,
      totalDuration: totalDuration,
      clips: clips.map((c, i) => ({
        index: i + 1,
        label: c.label,
        start: c.start,
        end: c.end,
        startFormatted: formatTime(c.start),
        endFormatted: formatTime(c.end),
        duration: c.end - c.start,
        durationFormatted: formatTime(c.end - c.start),
      }))
    };
    downloadJSON(data, `clipforge-draft-${Date.now()}.json`);
  };

  const exportFFmpeg = () => {
    const lines = clips.map((c, i) =>
      `# Clip ${i+1}: ${c.label}\nffmpeg -i INPUT.mp4 -ss ${c.start.toFixed(3)} -to ${c.end.toFixed(3)} -c copy clip_${String(i+1).padStart(2,'0')}_${c.label.replace(/\s+/g,'_')}.mp4`
    ).join('\n\n');
    const full = `#!/bin/bash\n# ClipForge Export — ${clips.length} clips\n# Generated: ${new Date().toISOString()}\n# Replace INPUT.mp4 with your video file\n\n${lines}\n\necho "All ${clips.length} clips extracted!"`;
    const blob = new Blob([full], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clipforge-export.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0
      }}>
        <span className="syne" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
          FINAL DRAFT
        </span>
        <div style={{
          background: clips.length >= 50 ? 'var(--accent2)' : 'var(--accent)',
          color: '#000', borderRadius: '3px', padding: '1px 7px',
          fontSize: '11px', fontWeight: 700
        }}>
          {clips.length}/50
        </div>
        <div style={{ flex: 1 }} />
        {clips.length > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
            Total: {formatTime(totalDuration)}
          </span>
        )}
      </div>

      {/* Clips list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {clips.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', gap: '8px'
          }}>
            <div style={{ fontSize: '32px' }}>📋</div>
            <div style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Draft is empty</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Cut clips to add them here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {clips.map((clip, i) => (
              <div
                key={clip.id}
                draggable
                onDragStart={e => handleDragStart(e, i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className="animate-in"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: dragOver === i ? 'var(--surface3)' : 'var(--surface2)',
                  border: `1px solid ${dragOver === i ? clip.color : 'var(--border)'}`,
                  borderLeft: `3px solid ${clip.color}`,
                  borderRadius: '3px', padding: '7px 8px',
                  transition: 'all 0.1s', opacity: draggingIdx === i ? 0.4 : 1,
                  cursor: 'grab'
                }}
              >
                <GripVertical size={12} color="var(--text3)" style={{ flexShrink: 0 }} />
                
                {/* Index */}
                <span style={{
                  fontSize: '10px', color: 'var(--text3)', width: '16px',
                  textAlign: 'right', flexShrink: 0
                }}>{i + 1}</span>

                {/* Label or edit */}
                {editingId === clip.id ? (
                  <input
                    autoFocus
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onLabelChange(clip.id, editVal); setEditingId(null); }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    style={{
                      flex: 1, background: 'var(--surface)', border: '1px solid var(--accent)',
                      borderRadius: '2px', color: 'var(--text)', padding: '2px 6px', fontSize: '12px'
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {clip.label}
                  </span>
                )}

                {/* Timestamps */}
                <span style={{ fontSize: '10px', color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatTime(clip.start)} → {formatTime(clip.end)}
                </span>

                {/* Duration */}
                <span style={{
                  fontSize: '10px', color: clip.color, flexShrink: 0,
                  background: clip.color + '22', padding: '1px 5px', borderRadius: '2px'
                }}>
                  {formatTime(clip.end - clip.start)}
                </span>

                {/* Actions */}
                {editingId === clip.id ? (
                  <>
                    <button onClick={() => { onLabelChange(clip.id, editVal); setEditingId(null); }}
                      style={{ background: 'transparent', color: 'var(--accent)', padding: '2px' }}>
                      <Check size={12} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: 'transparent', color: 'var(--text3)', padding: '2px' }}>
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onSeek?.(clip.start)}
                      title="Preview clip"
                      style={{ background: 'transparent', color: 'var(--text3)', padding: '2px' }}>
                      <Play size={11} />
                    </button>
                    <button onClick={() => { setEditingId(clip.id); setEditVal(clip.label); }}
                      title="Rename"
                      style={{ background: 'transparent', color: 'var(--text3)', padding: '2px' }}>
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => onRemove(clip.id)}
                      title="Remove"
                      style={{ background: 'transparent', color: '#ff4d4d', padding: '2px' }}>
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export buttons */}
      {clips.length > 0 && (
        <div style={{
          padding: '10px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '6px', flexShrink: 0
        }}>
          <button
            onClick={exportDraft}
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: '3px', color: 'var(--text2)', padding: '8px',
              fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            <Download size={12} />
            JSON
          </button>
          <button
            onClick={exportFFmpeg}
            style={{
              flex: 2, background: 'var(--accent)', border: 'none',
              borderRadius: '3px', color: '#000', padding: '8px',
              fontFamily: 'Syne', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            <FileDown size={12} />
            EXPORT FFMPEG SCRIPT
          </button>
        </div>
      )}
    </div>
  );
}
