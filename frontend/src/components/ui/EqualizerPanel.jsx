import React, { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = {
  'Flat': [0, 0, 0, 0, 0],
  'Bass Boost': [8, 6, 0, -1, -1],
  'Treble': [-2, -1, 1, 5, 7],
  'Pop': [-1, 3, 5, 3, -1],
  'Rock': [4, 3, -1, 2, 4],
  'Jazz': [3, 2, 0, -2, 1],
  'Electronic': [6, 4, -2, 2, 4]
};

const BANDS = [
  { label: '60Hz', name: 'subBass', idx: 0 },
  { label: '250Hz', name: 'bass', idx: 1 },
  { label: '1kHz', name: 'mid', idx: 2 },
  { label: '4kHz', name: 'presence', idx: 3 },
  { label: '16kHz', name: 'treble', idx: 4 }
];

export function EqualizerPanel({ isOpen, onClose, onEQChange, currentBands, isPlaying, buttonRect }) {
  const [isClosing, setIsClosing] = useState(false);
  const [activePreset, setActivePreset] = useState('Flat');
  const panelRef = useRef(null);

  // Determine preset
  useEffect(() => {
    let matched = 'Custom';
    for (const [name, values] of Object.entries(PRESETS)) {
      if (values.every((v, i) => v === currentBands[i])) {
        matched = name;
        break;
      }
    }
    setActivePreset(matched);
  }, [currentBands]);

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  // Close on tap outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    };
    // Delay to avoid immediate trigger
    setTimeout(() => window.addEventListener('click', handleClick), 10);
    return () => window.removeEventListener('click', handleClick);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handlePresetClick = (preset) => {
    const values = PRESETS[preset];
    values.forEach((val, i) => {
      onEQChange(i, val);
    });
  };

  const handleReset = () => {
    handlePresetClick('Flat');
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: '50%',
        bottom: `calc(100vh - ${(buttonRect?.top || 0)}px + 12px)`,
        transform: 'translateX(-50%)',
        width: 300,
        background: 'rgba(18,18,18,0.96)',
        border: 'none',
        borderRadius: 16,
        padding: 20,
        backdropFilter: 'blur(20px)',
        zIndex: 150,
        transformOrigin: 'bottom center',
        willChange: 'transform, opacity',
        animation: isClosing
          ? 'eqPanelClose 280ms cubic-bezier(0.32,0.72,0,1) forwards'
          : 'eqPanelOpen 380ms cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Drag Handle */}
      <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 12px' }} />
      
      {/* Title */}
      <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', margin: '0 0 16px 0' }}>
        Equalizer
      </h3>

      {/* Preset Pills */}
      <div className="h-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
        {Object.keys(PRESETS).map(preset => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            style={{
              width: 52, height: 26, borderRadius: 500, flexShrink: 0,
              background: activePreset === preset ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: activePreset === preset ? '#000' : '#B3B3B3',
              fontSize: 11, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            {preset}
          </button>
        ))}
        {activePreset === 'Custom' && (
          <button
            style={{
              width: 52, height: 26, borderRadius: 500, flexShrink: 0,
              background: 'var(--accent)', color: '#000',
              fontSize: 11, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            Custom
          </button>
        )}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        {BANDS.map((band) => {
          const val = currentBands[band.idx];
          const pct = ((val + 12) / 24) * 100;
          return (
            <div key={band.idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44 }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 8, height: 16 }}>
                {val > 0 ? `+${val}` : val}dB
              </span>
              
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <input
                  type="range"
                  min="-12" max="12" step="1"
                  value={val}
                  className="vertical-slider"
                  style={{ '--fill-percent': `${pct}%`, transition: 'background-size 0.3s' }}
                  onChange={(e) => {
                    const el = e.target;
                    const newVal = parseInt(el.value, 10);
                    const newPct = ((newVal + 12) / 24) * 100;
                    el.style.setProperty('--fill-percent', `${newPct}%`);
                    onEQChange(band.idx, newVal);
                  }}
                />
              </div>

              <span style={{ color: '#B3B3B3', fontSize: 10, marginTop: 8 }}>
                {band.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        style={{
          width: '100%', height: 36, background: 'rgba(255,255,255,0.08)', borderRadius: 8,
          color: '#B3B3B3', fontSize: 13, border: 'none', cursor: 'pointer',
        }}
      >
        Reset to Flat
      </button>
    </div>
  );
}

export function EqualizerButton({ isPlaying, isOpen, onClick }) {
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    const rect = buttonRef.current.getBoundingClientRect();
    onClick(rect);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: isOpen ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
        border: 'none',
        color: isOpen ? '#000' : '#fff',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2,
        paddingBottom: 11, cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s, border 0.2s',
        animation: isPlaying && !isOpen ? 'pulse 2s infinite' : 'none'
      }}
    >
      <div className={`eq-bar ${isPlaying ? 'playing-1' : 'paused'}`} style={{ height: '40%' }} />
      <div className={`eq-bar ${isPlaying ? 'playing-2' : 'paused'}`} style={{ height: '70%' }} />
      <div className={`eq-bar ${isPlaying ? 'playing-3' : 'paused'}`} style={{ height: '50%' }} />
    </button>
  );
}
