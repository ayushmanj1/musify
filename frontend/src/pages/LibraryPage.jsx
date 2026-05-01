/**
 * MUSIFY — Library Screen (Liked Songs)
 * Hero gradient card + song list + context actions
 */

import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { shareSong } from '../utils/share.js'
import { FiHeart, FiPlay, FiShuffle, FiMoreHorizontal } from 'react-icons/fi'

/* ─── Song Row ─── */
function SongRow({ song, index, onPlay, onRemove, isSaved }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="song-row" style={{ position: 'relative' }}>
      <button
        onClick={onPlay}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', height: 56, padding: '0 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', touchAction: 'manipulation',
        }}
      >
        <img src={song.thumbnail} alt="" width={48} height={48} loading="lazy"
          style={{ borderRadius: 'var(--radius-base)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{song.title}</p>
          <p className="truncate" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {song.artist}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          style={{
            background: 'none', border: 'none', padding: 8, cursor: 'pointer',
            color: 'var(--text-muted)', touchAction: 'manipulation',
          }}
        >
          <FiMoreHorizontal size={18} />
        </button>
      </button>

      {/* ─── Context Bottom Sheet ─── */}
      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 90, animation: 'fadeIn 280ms ease',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50)',
            width: '100%', maxWidth: 390, zIndex: 91,
            background: 'var(--bg-elevated)', borderRadius: '16px 16px 0 0',
            padding: '20px 0 calc(20px + var(--safe-bottom))',
            animation: 'slideUp 280ms cubic-bezier(0.32,0.72,0,1)',
          }}>
            {/* Song info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '0 20px 16px', borderBottom: '1px solid var(--surface-highlight)',
            }}>
              <img src={song.thumbnail} alt="" width={48} height={48}
                style={{ borderRadius: 'var(--radius-base)' }} />
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{song.title}</p>
                <p className="truncate" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{song.artist}</p>
              </div>
            </div>
            {/* Actions */}
            {[
              { label: 'Play next', action: () => { setShowMenu(false) } },
              { label: 'Add to queue', action: () => { setShowMenu(false) } },
              { label: 'Share', action: () => { shareSong(song); setShowMenu(false) } },
              { label: 'Remove from Liked', action: () => { onRemove(); setShowMenu(false) }, danger: true },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{
                width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                fontSize: 15, fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                color: item.danger ? '#E61E32' : 'var(--text-primary)',
                touchAction: 'manipulation',
              }}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══ LIBRARY PAGE ═══ */
export default function LibraryPage() {
  const { savedSongs, playSong, toggleSavedSong, isSongSaved } = usePlayer()

  const handlePlayAll = () => {
    if (savedSongs.length > 0) {
      playSong(savedSongs[0], savedSongs, 0)
    }
  }

  const handleShuffle = () => {
    if (savedSongs.length > 0) {
      const shuffled = [...savedSongs].sort(() => Math.random() - 0.5)
      playSong(shuffled[0], shuffled, 0)
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: '48px 16px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Your Library</h1>
      </div>

      {/* ─── Liked Songs Hero Card ─── */}
      <div style={{
        margin: '0 16px 20px',
        background: 'linear-gradient(135deg, #450AF5, #8E8FFA, #C4EFD9)',
        borderRadius: 'var(--radius-card)',
        padding: '20px 16px',
        minHeight: 140,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <FiHeart size={28} style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Liked Songs</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          {savedSongs.length} song{savedSongs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ─── Play/Shuffle Controls ─── */}
      {savedSongs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', marginBottom: 12,
        }}>
          <button onClick={handleShuffle} style={{
            background: 'none', border: 'none', padding: 8, cursor: 'pointer',
            color: 'var(--accent)', touchAction: 'manipulation',
          }}>
            <FiShuffle size={24} />
          </button>
          <button onClick={handlePlayAll} style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          }}>
            <FiPlay size={22} color="#121212" style={{ marginLeft: 2 }} />
          </button>
        </div>
      )}

      {/* ─── Song List ─── */}
      {savedSongs.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '48px 32px', color: 'var(--text-secondary)',
        }}>
          <FiHeart size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Songs you like will appear here
          </p>
          <p style={{ fontSize: 13, marginTop: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
            Save songs by tapping the heart icon
          </p>
        </div>
      ) : (
        savedSongs.map((song, i) => (
          <SongRow
            key={song.videoId}
            song={song}
            index={i}
            onPlay={() => playSong(song, savedSongs, i)}
            onRemove={() => toggleSavedSong(song)}
            isSaved={true}
          />
        ))
      )}
    </div>
  )
}
