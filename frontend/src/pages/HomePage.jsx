/**
 * MUSIFY — Home Screen
 * Time-based greeting, quick-access grid, horizontal scroll sections
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { searchSongs, getTrending } from '../utils/api.js'

/* ─── Greeting based on time ─── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ─── Top Artists Data ─── */
const TOP_ARTISTS = [
  { name: 'The Weeknd', img: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
  { name: 'Dua Lipa', img: 'https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg' },
  { name: 'Arijit Singh', img: 'https://i.ytimg.com/vi/SxTYjptEzZs/mqdefault.jpg' },
  { name: 'Drake', img: 'https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg' },
  { name: 'Taylor Swift', img: 'https://i.ytimg.com/vi/ic8j13piAhQ/mqdefault.jpg' },
  { name: 'Post Malone', img: 'https://i.ytimg.com/vi/SC4xMk98Pdc/mqdefault.jpg' },
]

/* ─── Quick Access Tile ─── */
function QuickTile({ name, img, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#282828', borderRadius: 4,
        height: 56, padding: 0, border: 'none', cursor: 'pointer',
        overflow: 'hidden', width: '100%', color: 'var(--text-primary)',
        touchAction: 'manipulation',
      }}
    >
      <img src={img} alt={name} width={36} height={36} loading="lazy"
        style={{ borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, paddingRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
    </button>
  )
}

/* ─── Square Card (110×110) ─── */
function SquareCard({ song, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 110, background: 'none', border: 'none', padding: 0,
      cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
      contentVisibility: 'auto', containIntrinsicSize: '110px 110px',
    }}>
      <img
        src={song.thumbnail} alt={song.title}
        width={110} height={110} loading="lazy"
        style={{ borderRadius: 'var(--radius-card)', width: 110, height: 110, objectFit: 'cover' }}
      />
      <p className="truncate" style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
        marginTop: 8, lineHeight: 1.3, width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {song.title}
      </p>
      <p className="truncate" style={{
        fontSize: 10, color: '#B3B3B3', marginTop: 2, width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {song.artist}
      </p>
    </button>
  )
}

/* ─── Circle Artist Card (90px) ─── */
function ArtistCircle({ name, img, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 90, background: 'none', border: 'none', padding: 0,
      cursor: 'pointer', textAlign: 'center', touchAction: 'manipulation',
      contentVisibility: 'auto', containIntrinsicSize: '90px 90px',
    }}>
      <img
        src={img} alt={name}
        width={90} height={90} loading="lazy"
        style={{ borderRadius: '50%', width: 90, height: 90, objectFit: 'cover' }}
      />
      <p className="truncate" style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
        marginTop: 8, width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {name}
      </p>
    </button>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ title }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 16px', marginBottom: 12,
    }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Show all</span>
    </div>
  )
}

/* ─── Skeleton Row ─── */
function SkeletonRow() {
  return (
    <div style={{ padding: '0 16px' }}>
      <div className="skeleton" style={{ width: 140, height: 20, marginBottom: 12 }} />
      <div className="h-scroll" style={{ padding: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: 110, height: 110, borderRadius: 'var(--radius-card)' }} />
        ))}
      </div>
    </div>
  )
}

/* ═══ HOME PAGE ═══ */
export default function HomePage() {
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [trending, setTrending] = useState([])
  const [madeForYou, setMadeForYou] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [trendData, mfyData] = await Promise.all([
          getTrending(),
          searchSongs('chill vibes music 2024')
        ])
        setTrending(trendData || [])
        setMadeForYou(mfyData || [])
      } catch (e) {
        console.error('Home load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePlaySong = (song, list, idx) => {
    playSong(song, list, idx)
  }

  const handleArtistClick = (name) => {
    navigate(`/artist/${encodeURIComponent(name)}`)
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ─── Top Bar: Greeting + Avatar ─── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '48px 16px 16px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{getGreeting()}</h1>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--surface-highlight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
        }}>
          M
        </div>
      </div>

      {/* ─── Quick Access Grid (3 columns) ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '0 16px', marginBottom: 28,
      }}>
        {TOP_ARTISTS.map((a, i) => (
          <QuickTile key={i} name={a.name} img={a.img}
            onClick={() => handleArtistClick(a.name)} />
        ))}
      </div>

      {/* ─── Made For You ─── */}
      {loading ? <SkeletonRow /> : madeForYou.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeader title="Made for you" />
          <div className="h-scroll">
            {madeForYou.slice(0, 8).map((song, i) => (
              <SquareCard key={song.videoId} song={song}
                onClick={() => handlePlaySong(song, madeForYou, i)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Hot Right Now (Trending) ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeader title="Hot right now" />
          <div className="h-scroll">
            {trending.slice(0, 8).map((song, i) => (
              <SquareCard key={song.videoId} song={song}
                onClick={() => handlePlaySong(song, trending, i)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Popular Artists ─── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="Popular artists" />
        <div className="h-scroll">
          {TOP_ARTISTS.map((a, i) => (
            <ArtistCircle key={i} name={a.name} img={a.img}
              onClick={() => handleArtistClick(a.name)} />
          ))}
        </div>
      </div>
    </div>
  )
}
