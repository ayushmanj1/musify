/**
 * MUSIFY v2.0 — ArtistPage
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Uses 64px horizontal song items instead of SongRow
 * - Removed playlist references
 * - No backdrop-filter blur
 * - Simplified layout
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getArtistSongs } from '../utils/api.js'
import SongCard from '../components/ui/SongCard.jsx'

export default function ArtistPage() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getArtistSongs(id)
        setArtist(data.artist)
        setSongs(data.songs || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: 800, margin: '0 auto' }}>
      {/* Artist Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        {artist?.image && (
          <img
            src={artist.image}
            alt=""
            width={64} height={64}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.3)' }}
            loading="lazy"
          />
        )}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            {artist?.name || id}
          </h1>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
            {songs.length} songs
          </p>
        </div>
      </div>

      {/* Songs */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {songs.map((song, i) => (
            <SongCard key={song.videoId} song={song} songs={songs} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
