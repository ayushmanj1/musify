import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { searchSongs, getTrending } from '../utils/api.js'
import { FiPlay, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useRef } from 'react'

/* ─── Greeting based on time ─── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ─── Top Artists Data ─── */
const TOP_ARTISTS = [
  { name: 'Honey Singh', img: 'https://i.ytimg.com/vi/NbyHNASFi6U/mqdefault.jpg' },
  { name: 'Lata Mangeshkar', img: 'https://i.ytimg.com/vi/TFr6G5zveS8/mqdefault.jpg' },
  { name: 'The Weeknd', img: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
  { name: 'Dua Lipa', img: 'https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg' },
  { name: 'Arijit Singh', img: 'https://i.ytimg.com/vi/SxTYjptEzZs/mqdefault.jpg' },
  { name: 'Drake', img: 'https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg' },
  { name: 'Seedhe Maut', img: 'https://i.ytimg.com/vi/dm2RHGYRtas/hqdefault.jpg' },
  { name: 'Taylor Swift', img: 'https://i.ytimg.com/vi/ic8j13piAhQ/mqdefault.jpg' },
  { name: 'Post Malone', img: 'https://i.ytimg.com/vi/SC4xMk98Pdc/mqdefault.jpg' },
]

/* ─── Section Header ─── */
function SectionHeader({ title, scrollRef }) {
  const scroll = (dir) => {
    if (scrollRef.current) {
      const amt = dir === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' });
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '16px',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{title}</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => scroll('left')} 
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <FiChevronLeft size={20} />
        </button>
        <button 
          onClick={() => scroll('right')} 
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <FiChevronRight size={20} />
        </button>
      </div>
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
    <div 
      className="vertical-card" 
      onClick={onClick} 
      onContextMenu={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-context-menu', {
          detail: { x: e.clientX, y: e.clientY, song, type: 'song' }
        }));
      }}
      style={{
      width: '180px', height: '220px',
      padding: '16px',
      borderRadius: '12px',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    className="vertical-card glass-box">
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
    <div style={{ background: '#121212', borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
      <div className="skeleton" style={{ width: '140px', height: '24px', marginBottom: '16px' }} />
      <div className="h-scroll" style={{ paddingBottom: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '180px', height: '220px', borderRadius: '12px', flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}

/* ═══ HOME PAGE ═══ */
export default function HomePage() {
  const navigate = useNavigate()
  const { playSong, userPlaylists, recentlyPlayed } = usePlayer()
  const [trending, setTrending] = useState([])
  const [madeForYou, setMadeForYou] = useState([])
  const [popularAlbums, setPopularAlbums] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  const recentRef = useRef(null)
  const artistsRef = useRef(null)
  const listenRef = useRef(null)
  const newRef = useRef(null)
  const recomRef = useRef(null)
  const popularRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [trendData, mfyData, albumData, recomData] = await Promise.all([
          getTrending(),
          searchSongs('chill vibes music 2024'),
          searchSongs('popular music albums 2024 hits'),
          searchSongs('latest popular songs recommendation 2024')
        ])
        setTrending(trendData || [])
        setMadeForYou(mfyData || [])
        setPopularAlbums(albumData || [])
        setRecommendations(recomData || [])
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
  const recentTracks = madeForYou.slice(0, 8)

  return (
    <div style={{ padding: '16px 32px 64px' }}>
      {/* ─── 2. Recently Played (Scroll Row) ─── */}
      <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
        <SectionHeader title="Recently Played" scrollRef={recentRef} />
        <div className="h-scroll" style={{ paddingBottom: 0 }} ref={recentRef}>
          {recentTracks.map((song, i) => (
            <VerticalCard 
              key={i} 
              song={song} 
              onClick={() => handlePlaySong(song, recentTracks, i)} 
            />
          ))}
        </div>
      </div>

      {/* ─── 3. Your Playlists (Quick Jump) ─── */}
      <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
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
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.2s',
                  position: 'relative'
                }}
                className="playlist-quick-card glass-box"
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
      <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
        <SectionHeader title="Popular Artists" scrollRef={artistsRef} />
        <div className="h-scroll" style={{ paddingBottom: 0 }} ref={artistsRef}>
          {TOP_ARTISTS.map((artist, i) => (
            <VerticalCard key={i} song={artist} isArtist onClick={() => handleArtistClick(artist.name)} />
          ))}
        </div>
      </div>

      {/* ─── 4b. Recently Played (Scroll Row) ─── */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
          <SectionHeader title="Recently Listened" scrollRef={listenRef} />
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={listenRef}>
            {recentlyPlayed.slice(0, 10).map((song, i) => (
              <VerticalCard key={song.videoId || i} song={song} onClick={() => handlePlaySong(song, recentlyPlayed, i)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. New Releases (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
          <SectionHeader title="New Releases" scrollRef={newRef} />
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={newRef}>
            {trending.slice(0, 8).map((song, i) => (
              <VerticalCard key={song.videoId} song={song} isNewRelease onClick={() => navigate(`/playlist/New%20Releases`)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── 7. Featured Podcasts (Large Cards) ─── */}
      <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
        <SectionHeader title="Featured Podcasts" />
        <div className="podcast-grid-premium" style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px',
          maxHeight: '1020px', // Even more generous height
          overflow: 'hidden'
        }}>
          {[
            {
              title: "Episode 302 | The HAUNTED TRIP To HIMACHAL PRADESH",
              author: "Akshay Horror Podcast",
              thumbnail: "https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/SxTYjptEzZs/maxresdefault.jpg",
              date: "May 4", duration: "24 min 40 sec",
              color: "#7c0000",
              desc: "Watch as we explore the darkest corners of the supernatural world, uncovering secrets that..."
            },
            {
              title: "Lakshya Sen on Champion Mindset, Olympic Heartbreak...",
              author: "Raj Shamani's Figuring Out",
              thumbnail: "https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg",
              date: "May 2", duration: "2 hr 8 min",
              color: "#333333",
              desc: "Laksya Sen talks about his journey, mindset and what it takes to be a champion at the highest level..."
            },
            {
              title: "Bhoot Bangla - Haunted House | Horror Stories",
              author: "The Horror Show by Khooni Mond...",
              thumbnail: "https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/ic8j13piAhQ/maxresdefault.jpg",
              date: "Apr 18", duration: "11 min 31 sec",
              color: "#9b0000",
              desc: "A couple visits a strange old abandoned mansion on a trip, but what they didn't know..."
            },
            {
              title: "Elon Musk on AI, Mars and the Future of X",
              author: "The Joe Rogan Experience",
              thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/uxpDa-c-4Mc/maxresdefault.jpg",
              date: "May 1", duration: "2 hr 45 min",
              color: "#1e1e1e",
              desc: "Elon Musk returns to the podcast to discuss the rapid advancement of artificial intelligence..."
            },
            {
              title: "Simon Sinek: Why You Feel Unfulfilled & How To Fix It",
              author: "The Diary Of A CEO",
              thumbnail: "https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/SxTYjptEzZs/maxresdefault.jpg",
              date: "Apr 25", duration: "1 hr 32 min",
              color: "#2a2a2a",
              desc: "Simon Sinek shares his profound insights on human psychology, leadership, and finding your why..."
            },
            {
              title: "Science of Optimization & Peak Performance",
              author: "Huberman Lab",
              thumbnail: "https://i.ytimg.com/vi/ic8j13piAhQ/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg",
              date: "Apr 20", duration: "2 hr 12 min",
              color: "#0d2b45",
              desc: "Dr. Andrew Huberman discusses the latest science on sleep, nutrition, and neural circuits..."
            }
          ].map((pod, i) => (
            <div key={i} style={{
              background: pod.color, borderRadius: '16px',
              padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
              cursor: 'pointer', transition: 'transform 0.2s ease',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }} className="podcast-card-premium">
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={pod.thumbnail} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="truncate-2" style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{pod.title}</h4>
                  <p className="truncate" style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiPlay size={10} fill="currentColor" /> Video
                    </span> • {pod.author}
                  </p>
                </div>
              </div>

              {/* Card Poster */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <img src={pod.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {pod.date} • {pod.duration} • <span style={{ opacity: 0.8, fontWeight: 500 }}>{pod.desc}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <button style={{ 
                    background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '20px', 
                    padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}>
                    <FiPlay size={12} fill="currentColor" /> Preview episode
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiPlus size={20} style={{ color: '#fff', cursor: 'pointer', opacity: 0.8 }} />
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <FiPlay size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5b. Popular Albums (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : popularAlbums.length > 0 && (
        <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
          <SectionHeader title="Popular Albums" scrollRef={popularRef} />
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={popularRef}>
            {popularAlbums.slice(0, 10).map((song, i) => (
              <VerticalCard 
                key={song.videoId || i} 
                song={song} 
                onClick={() => navigate(`/playlist/${encodeURIComponent(song.title)}`)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. Recommended For You (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : recommendations.length > 0 && (
        <div className="glass-box" style={{ borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
          <SectionHeader title="Recommended For You" scrollRef={recomRef} />
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={recomRef}>
            {recommendations.slice(0, 10).map((song, i) => (
              <VerticalCard 
                key={song.videoId || i} 
                song={{...song, genre: 'Pop/Trending'}} 
                isRecommended 
                onClick={() => navigate(`/playlist/Recommended%20For%20You`)} 
              />
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
          background: rgba(255,255,255,0.1) !important;
          transform: scale(1.04) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important;
        }
        .vertical-card:hover .hover-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .recently-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          max-height: 144px;
          overflow: hidden;
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          max-height: 176px;
          overflow: hidden;
        }

        @media (max-width: 1400px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (max-width: 1200px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
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
          transform: scale(1.03) !important;
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
