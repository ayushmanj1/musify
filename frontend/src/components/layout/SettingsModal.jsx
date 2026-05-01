import { usePlayer } from '../../context/PlayerContext.jsx'
import { FiX } from 'react-icons/fi'

export default function SettingsModal({ onClose }) {
  const {
    crossfadeEnabled, setCrossfadeEnabled,
    crossfadeDuration, setCrossfadeDuration
  } = usePlayer()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      
      <div style={{
        position: 'relative', background: '#282828',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '24px', paddingBottom: 'calc(24px + var(--safe-bottom))',
        width: '100%', maxWidth: 390, margin: '0 auto',
        animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
            <FiX size={24} />
          </button>
        </div>

        {/* Crossfade Settings */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Crossfade</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Seamless transitions between songs
              </p>
            </div>
            
            {/* Toggle Switch */}
            <div 
              onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: crossfadeEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2,
                left: crossfadeEnabled ? 22 : 2,
                transition: 'left 0.2s',
              }} />
            </div>
          </div>

          {crossfadeEnabled && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{crossfadeDuration}s</span>
              </div>
              <input 
                type="range" 
                min="0" max="10" step="1"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)', height: 4 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
