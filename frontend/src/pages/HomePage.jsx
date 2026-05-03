import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { searchSongs, getTrending } from '../utils/api.js'
import { FiPlay } from 'react-icons/fi'

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

/* ─── Section Header ─── */
function SectionHeader({ title }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '16px',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{title}</h2>
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA', cursor: 'pointer' }} className="hover-underline">Show all</span>
    </div>
  )
}

/* ─── Play Button (Hover) ─── */
function HoverPlayButton({ style }) {
  return (
    <div className="hover-play-btn" style={{
      position: 'absolute',
      width: '48px', height: '48px',
      borderRadius: '50%',
      background: '#8B5CF6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      opacity: 0,
      transform: 'translateY(8px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      zIndex: 10,
      ...style
    }}>
      <FiPlay size={20} style={{ fill: '#ffffff', color: '#ffffff', marginLeft: '4px' }} />
    </div>
  )
}

/* ─── Vertical Card (180x220) ─── */
function VerticalCard({ song, isArtist, isNewRelease, isRecommended, onClick }) {
  return (
    <div className="vertical-card" onClick={onClick} style={{
      width: '180px', height: '220px',
      background: '#181818',
      padding: '16px',
      borderRadius: '8px',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      transition: 'background 0.2s ease, box-shadow 0.2s ease',
    }}>
      <div style={{ position: 'relative', width: '148px', height: '148px', marginBottom: '16px', background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)', borderRadius: isArtist ? '50%' : '4px' }}>
        <img
          src={song.thumbnail || song.img} alt={song.title || song.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isArtist ? '50%' : '4px' }}
        />
        {isNewRelease && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: '#8B5CF6', color: '#fff',
            fontSize: '8px', fontWeight: 700, padding: '2px 6px',
            borderRadius: '500px', zIndex: 2
          }}>
            NEW
          </div>
        )}
        <HoverPlayButton style={{ bottom: '8px', right: '8px' }} />
      </div>
      <div style={{ width: '100%' }}>
        <p className="truncate" style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
          {song.title || song.name}
        </p>
        <p className="truncate" style={{ fontSize: '14px', color: isRecommended ? '#A78BFA' : '#b3b3b3' }}>
          {isArtist ? 'Artist' : (isRecommended ? song.genre || 'Electronic' : song.artist)}
        </p>
      </div>
    </div>
  )
}

/* ─── Skeleton Row ─── */
function SkeletonRow() {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div className="skeleton" style={{ width: '140px', height: '24px', marginBottom: '16px' }} />
      <div className="h-scroll">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '180px', height: '220px', borderRadius: '8px', flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}

/* ═══ HOME PAGE ═══ */
export default function HomePage() {
  const navigate = useNavigate()
  const { playSong, userPlaylists } = usePlayer()
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
    if (!song.videoId) return // Prevent playing raw artist stubs
    playSong(song, list, idx)
  }

  const handleArtistClick = (name) => {
    navigate(`/artist/${encodeURIComponent(name)}`)
  }

  // 6 mock tracks for Recently Listened
  const recentTracks = madeForYou.slice(0, 6)

  return (
    <div style={{ padding: '24px 32px 64px' }}>
      {/* ─── 1. Greeting Header ─── */}
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
        {getGreeting()}
      </h1>

      {/* ─── 2. Recently Listened (Grid) ─── */}
      <div style={{ marginBottom: '40px' }}>
        <div className="recently-grid">
          {recentTracks.map((song, i) => (
            <div key={i} className="recent-card" onClick={() => handlePlaySong(song, recentTracks, i)} style={{
              height: '64px',
              background: '#282828',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'background 0.2s ease',
            }}>
              <img
                src={song.thumbnail} alt={song.title}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', flexShrink: 0, background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)' }}
              />
              <div className="truncate" style={{ flex: 1, padding: '0 16px', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                {song.title}
              </div>
              <HoverPlayButton style={{ right: '16px', transform: 'translateY(0)', width: '40px', height: '40px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. Your Playlists (Quick Jump) ─── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="Your Playlists" />
        <div className="playlists-grid">
          {userPlaylists.slice(0, 10).map((playlist, i) => {
            const isLiked = playlist.name === 'Liked Songs'
            return (
              <div 
                key={i} 
                onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.name)}`)}
                className="playlist-quick-card"
                style={{
                  background: '#242424',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '56px', height: '56px',
                  background: playlist.color || '#4C1D95',
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '24px', fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}>
                  {isLiked ? '💜' : playlist.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="truncate" style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>{playlist.name}</p>
                  <p style={{ fontSize: '12px', color: '#b3b3b3', margin: '4px 0 0 0' }}>Playlist</p>
                </div>
                <div className="card-play-btn" style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: '#8B5CF6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transform: 'scale(0.8)', transition: 'all 0.2s'
                }}>
                  <FiPlay size={14} style={{ fill: '#fff', color: '#fff', marginLeft: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 4. Made For You (Scroll Row) ─── */}

      {/* ─── 4. Popular Artists (Scroll Row) ─── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="Popular Artists" />
        <div className="h-scroll">
          {TOP_ARTISTS.map((artist, i) => (
            <VerticalCard key={i} song={artist} isArtist onClick={() => handleArtistClick(artist.name)} />
          ))}
        </div>
      </div>

      {/* ─── 5. New Releases (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <SectionHeader title="New Releases" />
          <div className="h-scroll">
            {trending.slice(0, 8).map((song, i) => (
              <VerticalCard key={song.videoId} song={song} isNewRelease onClick={() => handlePlaySong(song, trending, i)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. Recommended For You (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <SectionHeader title="Recommended For You" />
          <div className="h-scroll">
            {trending.slice(8, 16).map((song, i) => (
              <VerticalCard key={song.videoId} song={{...song, genre: 'Pop/Trending'}} isRecommended onClick={() => handlePlaySong(song, trending, i)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Scoped Styles ─── */}
      <style>{`
        /* Scrollable rows */
        .h-scroll {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 24px; /* Space for box-shadow hover */
        }
        .h-scroll::-webkit-scrollbar {
          display: none;
        }

        /* Vertical Card Hover */
        .vertical-card:hover {
          background: #282828 !important;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3) !important;
        }
        .vertical-card:hover .hover-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .recently-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, 1fr);
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .playlists-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .recently-grid { grid-template-columns: repeat(2, 1fr); }
          .playlists-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .recent-card:hover {
          background: #333333 !important;
        }
        .recent-card:hover .hover-play-btn {
          opacity: 1 !important;
        }

        .playlist-quick-card:hover {
          background: #2a2a2a !important;
          transform: translateY(-2px);
        }
        .playlist-quick-card:hover .card-play-btn {
          opacity: 1;
          transform: scale(1);
        }

        .hover-underline:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
