import React, { useState, useEffect } from 'react';
import { formatTime, parseTime, isValidTimeString, generateClipId, CLIP_COLORS } from '../utils/index.js';
import { Plus, Clock, Scissors, AlertCircle } from 'lucide-react';

export default function ClipEditor({
  duration,
  currentTime,
  selection,
  onSelectionChange,
  onAddClip,
  clipCount,
  onSeek,
}) {
  const [startStr, setStartStr] = useState('00:00:00');
  const [endStr, setEndStr] = useState('00:00:00');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  // Sync from selection
  useEffect(() => {
    if (selection) {
      setStartStr(formatTime(selection.start));
      setEndStr(formatTime(selection.end));
    }
  }, [selection]);

  const handleStartChange = (val) => {
    setStartStr(val);
    setError('');
    if (isValidTimeString(val)) {
      const t = parseTime(val);
      onSelectionChange?.({ start: t, end: selection?.end ?? t + 5 });
    }
  };

  const handleEndChange = (val) => {
    setEndStr(val);
    setError('');
    if (isValidTimeString(val)) {
      const t = parseTime(val);
      onSelectionChange?.({ start: selection?.start ?? 0, end: t });
    }
  };

  const handleAdd = () => {
    if (clipCount >= 50) {
      setError('Draft is full (50 clips max)');
      return;
    }

    const start = parseTime(startStr);
    const end = parseTime(endStr);

    if (isNaN(start) || isNaN(end)) {
      setError('Invalid timestamps');
      return;
    }
    if (start >= end) {
      setError('Start must be before end');
      return;
    }
    if (duration && end > duration) {
      setError(`End exceeds video duration (${formatTime(duration)})`);
      return;
    }

    const clip = {
      id: generateClipId(),
      start,
      end,
      label: label.trim() || `Clip ${clipCount + 1}`,
      color: CLIP_COLORS[clipCount % CLIP_COLORS.length],
      duration: end - start,
    };

    onAddClip(clip);
    setLabel('');
    setError('');
  };

  const setCurrentAsStart = () => {
    const t = formatTime(currentTime);
    setStartStr(t);
    onSelectionChange?.({ start: currentTime, end: selection?.end ?? currentTime + 5 });
  };

  const setCurrentAsEnd = () => {
    const t = formatTime(currentTime);
    setEndStr(t);
    onSelectionChange?.({ start: selection?.start ?? 0, end: currentTime });
  };

  const clipDuration = (() => {
    const s = parseTime(startStr);
    const e = parseTime(endStr);
    if (!isNaN(s) && !isNaN(e) && e > s) return e - s;
    return 0;
  })();

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Scissors size={14} color="var(--accent)" />
        <span className="syne" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text)' }}>
          CLIP CUTTER
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto' }}>
          {clipCount}/50 clips
        </span>
      </div>

      {/* Timestamp row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Start */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.08em' }}>IN POINT</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              value={startStr}
              onChange={e => handleStartChange(e.target.value)}
              placeholder="00:00:00"
              style={{
                flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '3px', color: 'var(--accent)', padding: '6px 8px',
                fontSize: '13px', width: 0
              }}
            />
            <button
              onClick={setCurrentAsStart}
              title="Set to current time"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '3px', color: 'var(--text2)', padding: '6px',
                display: 'flex', alignItems: 'center'
              }}>
              <Clock size={12} />
            </button>
          </div>
        </div>

        {/* End */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.08em' }}>OUT POINT</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              value={endStr}
              onChange={e => handleEndChange(e.target.value)}
              placeholder="00:00:00"
              style={{
                flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '3px', color: 'var(--accent2)', padding: '6px 8px',
                fontSize: '13px', width: 0
              }}
            />
            <button
              onClick={setCurrentAsEnd}
              title="Set to current time"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '3px', color: 'var(--text2)', padding: '6px',
                display: 'flex', alignItems: 'center'
              }}>
              <Clock size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Duration preview */}
      {clipDuration > 0 && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '3px', padding: '6px 10px', fontSize: '11px', color: 'var(--text2)',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>Duration</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatTime(clipDuration)}</span>
        </div>
      )}

      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.08em' }}>CLIP LABEL (OPTIONAL)</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`Clip ${clipCount + 1}`}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: '3px', color: 'var(--text)', padding: '6px 8px',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'var(--accent2)', fontSize: '11px'
        }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={clipCount >= 50}
        style={{
          background: clipCount >= 50 ? 'var(--surface2)' : 'var(--accent)',
          color: clipCount >= 50 ? 'var(--text3)' : '#000',
          border: 'none', borderRadius: '4px', padding: '10px',
          fontFamily: 'Syne', fontWeight: 700, fontSize: '12px',
          letterSpacing: '0.1em', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px', transition: 'all 0.15s'
        }}
      >
        <Plus size={14} />
        ADD TO DRAFT
      </button>
    </div>
  );
}
