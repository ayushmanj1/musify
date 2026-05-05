import React, { useState, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiMusic, FiChevronRight, FiSearch } from 'react-icons/fi'

const CATEGORIES = [
  { name: 'Pop', color: '#E13300', emoji: '🎤' },
  { name: 'Hip-Hop', color: '#BA5D07', emoji: '🎧' },
  { name: 'Rock', color: '#1E3264', emoji: '🎸' },
  { name: 'Electronic', color: '#0D73EC', emoji: '🎹' },
  { name: 'Lo-Fi', color: '#148A08', emoji: '☁️' },
  { name: 'Classical', color: '#509BF5', emoji: '🎻' },
  { name: 'Jazz', color: '#E8115B', emoji: '🎷' },
  { name: 'R&B', color: '#8400E7', emoji: '🥃' },
  { name: 'Synthwave', color: '#4B0082', emoji: '🌃' },
  { name: 'Acoustic', color: '#BC5900', emoji: '🪵' },
  { name: 'Workout', color: '#E91429', emoji: '💪' },
  { name: 'Focus', color: '#8B5CF6', emoji: '🧠' },
  { name: 'Chill', color: '#1E3264', emoji: '🧊' },
  { name: 'Party', color: '#AF2896', emoji: '🎉' },
  { name: 'Sleep', color: '#1E3264', emoji: '😴' },
  { name: 'Gaming', color: '#0D73EC', emoji: '🎮' },
  { name: 'Indie', color: '#E91429', emoji: '🎸' },
  { name: 'Soul', color: '#BC5900', emoji: '🔥' },
  { name: 'Romance', color: '#E91429', emoji: '💖' },
  { name: 'K-Pop', color: '#AF2896', emoji: '🇰🇷' },
  { name: 'Metal', color: '#1E3264', emoji: '🤘' },
  { name: 'Country', color: '#BC5900', emoji: '🤠' },
  { name: 'Blues', color: '#0D73EC', emoji: '🎸' },
  { name: 'Reggae', color: '#148A08', emoji: '🦁' }
]

export default function SearchPage() {
  const { 
    searchQuery, setSearchQuery, 
    masterPlaylistData, playSong,
    userPlaylists
  } = usePlayer()

  const [results, setResults] = useState({ songs: [], playlists: [], artists: [] })
  const [isSearching, setIsSearching] = useState(false)

  // Escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchQuery('')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchQuery])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true)
        const q = searchQuery.toLowerCase()
        
        // 1. Local Data Filter
        const localSongs = masterPlaylistData.filter(s => 
          s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
        )
        const localPlaylists = userPlaylists.filter(p => 
          p.name.toLowerCase().includes(q)
        )
        const allArtists = Array.from(new Set(masterPlaylistData.map(s => s.artist)))
        const localArtists = allArtists.filter(a => a.toLowerCase().includes(q))

        // 2. API Data Fetch
        try {
          const { searchSongs } = await import('../utils/api.js')
          const apiSongs = await searchSongs(searchQuery)
          
          const combinedSongs = [...localSongs]
          apiSongs.forEach(apiS => {
            if (!combinedSongs.find(s => s.videoId === apiS.videoId)) {
              combinedSongs.push(apiS)
            }
          })

          setResults({ songs: combinedSongs, playlists: localPlaylists, artists: localArtists })
        } catch (err) {
          console.error('Search API error:', err)
          setResults({ songs: localSongs, playlists: localPlaylists, artists: localArtists })
        }
      } else {
        setIsSearching(false)
        setResults({ songs: [], playlists: [], artists: [] })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, masterPlaylistData, userPlaylists])

  const isEmpty = searchQuery.trim().length === 0

  return (
    <div style={{ padding: '24px 32px', minHeight: '100%' }}>
      
      {/* STATE 1: BROWSE CATEGORIES */}
      <div style={{ display: isEmpty ? 'block' : 'none', background: '#121212', borderRadius: '12px', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>Browse all</h1>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {CATEGORIES.map(cat => (
            <div 
              key={cat.name} 
              onClick={() => setSearchQuery(cat.name)}
              style={{
                height: '120px', background: cat.color, borderRadius: '8px',
                padding: '12px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
                transition: '0.2s ease'
              }}
              className="category-card"
            >
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{cat.name}</span>
              <span style={{
                position: 'absolute', bottom: '-10px', right: '-10px',
                fontSize: '64px', transform: 'rotate(25deg)', opacity: 0.8
              }}>{cat.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATE 2: SEARCH RESULTS */}
      {!isEmpty && (
        <div className="results-container" style={{ opacity: isSearching ? 1 : 0, transition: 'opacity 0.2s ease' }}>
          
          {results.songs.length > 0 ? (
            <div style={{ animation: 'staggerIn 0.25s ease forwards' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Songs</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '20px',
                background: '#121212',
                padding: '24px',
                borderRadius: '12px'
              }}>
                {results.songs.map((song, i) => (
                  <div key={song.videoId} className="search-song-card" 
                    onClick={() => playSong(song, results.songs, i)} 
                    onContextMenu={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open-context-menu', {
                        detail: { x: e.clientX, y: e.clientY, song, type: 'song' }
                      }));
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: '16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                      <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="search-card-play-btn" style={{
                        position: 'absolute', bottom: '8px', right: '8px',
                        width: '40px', height: '40px', borderRadius: '50%', background: '#8B5CF6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transform: 'translateY(10px)', transition: 'all 0.2s'
                      }}>
                        <FiPlay size={18} style={{ fill: '#fff', color: '#fff', marginLeft: '2px' }} />
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="truncate" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{song.title}</p>
                      <p className="truncate" style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#b3b3b3' }}>{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* NO RESULTS STATE */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
              <FiSearch size={48} style={{ color: '#fff', opacity: 0.4, marginBottom: '24px' }} />
              <p style={{ color: '#b3b3b3', fontSize: '16px', margin: 0 }}>No results found for</p>
              <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '4px 0 8px' }}>"{searchQuery}"</p>
              <p style={{ color: '#b3b3b3', fontSize: '13px' }}>Please make sure your words are spelled correctly.</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .category-card:hover { filter: brightness(1.15); transform: scale(1.04) !important; }
        .search-song-card:hover { 
          background: rgba(255,255,255,0.1) !important; 
          transform: scale(1.04) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }
        .search-song-card:hover .search-card-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
