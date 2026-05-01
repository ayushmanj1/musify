/**
 * MUSIFY v2.0 — LibraryPage (Liked Songs Only)
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed History tab entirely
 * - Removed Playlist tab entirely
 * - Only shows Liked/Saved songs
 * - Uses 64px horizontal song items
 * - No backdrop-filter blur
 * - Removed Clerk dependency
 */

import { usePlayer } from '../context/PlayerContext.jsx'
import SongCard from '../components/ui/SongCard.jsx'

export default function LibraryPage() {
  const { savedSongs } = usePlayer()

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', marginBottom: 4,
        }}>
          Liked Songs
        </h1>
        <p style={{
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
        }}>
          {savedSongs.length} {savedSongs.length === 1 ? 'song' : 'songs'}
        </p>
      </header>

      {savedSongs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {savedSongs.map((song, i) => (
            <SongCard key={song.videoId} song={song} songs={savedSongs} index={i} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 0', textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 20,
          }}>
            ❤️
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            No liked songs yet
          </h3>
          <p style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
            maxWidth: 240, lineHeight: 1.5,
          }}>
            Songs you like will appear here for quick access
          </p>
        </div>
      )}
    </div>
  )
}
