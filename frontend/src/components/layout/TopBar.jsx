import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { FiSearch, FiX, FiUser, FiSettings, FiLogOut, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function TopBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { id: playlistId } = useParams()
  const { 
    searchQuery, setSearchQuery, 
    navHistory, setNavHistory,
    navIndex, setNavIndex,
    masterPlaylistData, playSong,
    userPlaylists
  } = usePlayer()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [results, setResults] = useState({ songs: [], playlists: [], artists: [] })
  
  const searchInputRef = useRef(null)
  const barRef = useRef(null)

  // Navigation History logic
  useEffect(() => {
    // Only push if it's a new path (not back/forward)
    if (navHistory[navIndex] !== pathname) {
      const newHistory = navHistory.slice(0, navIndex + 1)
      newHistory.push(pathname)
      setNavHistory(newHistory)
      setNavIndex(newHistory.length - 1)
    }
  }, [pathname])

  const goBack = () => {
    if (navIndex > 0) {
      const targetIdx = navIndex - 1
      setNavIndex(targetIdx)
      navigate(navHistory[targetIdx])
    }
  }

  const goForward = () => {
    if (navIndex < navHistory.length - 1) {
      const targetIdx = navIndex + 1
      setNavIndex(targetIdx)
      navigate(navHistory[targetIdx])
    }
  }

  // Auto-focus search input on Search page
  useEffect(() => {
    if (pathname === '/search') {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [pathname])

  // Search logic with 300ms debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase()
        
        // 1. Local Filter (for instant results from library/recs)
        const localSongs = masterPlaylistData
          .filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
          .slice(0, 5)

        const localPlaylists = userPlaylists
          .filter(p => p.name.toLowerCase().includes(q))
          .slice(0, 3)

        const allArtists = Array.from(new Set(masterPlaylistData.map(s => s.artist)))
        const localArtists = allArtists
          .filter(a => a.toLowerCase().includes(q))
          .slice(0, 3)

        setResults({ songs: localSongs, playlists: localPlaylists, artists: localArtists })
        setShowSearchDropdown(true)

        // 2. API Fetch (for global YouTube results)
        try {
          const { searchSongs } = await import('../../utils/api.js')
          const apiSongs = await searchSongs(searchQuery)
          
          // Merge API songs with local songs, unique by videoId
          const combinedSongs = [...localSongs]
          apiSongs.forEach(apiS => {
            if (!combinedSongs.find(s => s.videoId === apiS.videoId)) {
              combinedSongs.push(apiS)
            }
          })
          
          setResults(prev => ({ ...prev, songs: combinedSongs.slice(0, 8) }))
        } catch (err) {
          console.error('API search failed', err)
        }
      } else {
        setShowSearchDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, masterPlaylistData, userPlaylists])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!barRef.current?.contains(e.target)) {
        setIsProfileOpen(false)
        setShowSearchDropdown(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false)
        setIsProfileOpen(false)
        searchInputRef.current?.blur()
      }
      
      // Auto-focus logic: If typing letters/numbers and not in an input
      if (
        pathname !== '/search' && 
        /^[a-zA-Z0-9]$/.test(e.key) && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
        !e.ctrlKey && !e.metaKey && !e.altKey
      ) {
        navigate('/search')
        // The pathname check will trigger the focus useEffect in the next render
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, navigate])

  const handleSongClick = (song) => {
    playSong(song, results.songs, results.songs.indexOf(song))
    setShowSearchDropdown(false)
  }

  const handlePlaylistClick = (name) => {
    navigate(`/playlist/${encodeURIComponent(name)}`)
    setShowSearchDropdown(false)
  }

  const handleArtistClick = (artist) => {
    navigate(`/artist/${encodeURIComponent(artist)}`)
    setShowSearchDropdown(false)
  }

  // Page Title logic
  const getPageTitle = () => {
    if (pathname === '/') return ''
    if (pathname === '/search') return 'search' // input will show
    if (pathname === '/library') return 'Your Library'
    if (pathname.startsWith('/playlist/')) return decodeURIComponent(pathname.split('/').pop())
    if (pathname.startsWith('/artist/')) return decodeURIComponent(pathname.split('/').pop())
    return ''
  }

  const pageTitle = getPageTitle()
  const isSearchPage = pathname === '/search'

  return (
    <div ref={barRef} className="top-bar-sticky" style={{
      position: 'sticky', top: 0, zIndex: 1000,
      height: '64px', width: '100%',
      background: 'rgba(18,18,18,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      
      {/* Left Navigation */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={goBack} disabled={navIndex === 0} 
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: navIndex === 0 ? 'not-allowed' : 'pointer', opacity: navIndex === 0 ? 0.4 : 1 }}
          className="nav-arrow-btn">
          <FiArrowLeft size={20} />
        </button>
        <button onClick={goForward} disabled={navIndex === navHistory.length - 1}
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: navIndex === navHistory.length - 1 ? 'not-allowed' : 'pointer', opacity: navIndex === navHistory.length - 1 ? 0.4 : 1 }}
          className="nav-arrow-btn">
          <FiArrowRight size={20} />
        </button>
      </div>

      {/* Center Search / Title */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {isSearchPage ? (
          <div style={{ position: 'relative', width: '360px' }}>
            <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#b3b3b3', zIndex: 2 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-premium"
              style={{
                width: '100%', height: '40px', background: '#242424', borderRadius: '24px', border: 'none',
                padding: '0 40px 0 42px', color: '#fff', fontSize: '14px', outline: 'none',
                transition: 'border 0.15s ease, background 0.15s ease'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '20px', height: '20px', borderRadius: '50%', background: '#b3b3b3', color: '#121212',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px'
              }}>
                <FiX />
              </button>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Compact Search Bar (Visible on Home) */}
        {pathname === '/' && (
          <div style={{ position: 'relative', width: '220px', marginRight: '8px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#b3b3b3', fontSize: '14px' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value) navigate('/search')
              }}
              style={{
                width: '100%', height: '36px', background: '#242424', borderRadius: '18px', border: 'none',
                padding: '0 12px 0 34px', color: '#fff', fontSize: '13px', outline: 'none'
              }}
            />
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <div onClick={() => { setIsProfileOpen(!isProfileOpen); }} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>A</span>
          </div>

          {isProfileOpen && (
            <div className="topbar-dropdown" style={{ width: '180px', right: '0', top: '48px', padding: '8px 0' }}>
              {["Account", "Profile", "Settings"].map(it => (
                <div key={it} className="dropdown-item">{it}</div>
              ))}
              <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
              <div className="dropdown-item" style={{ color: '#ef4444' }}>Log out</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-input-premium:focus { border: 2px solid #ffffff !important; }
        .search-input-premium:hover:not(:focus) { background: #2a2a2a !important; }
        .topbar-dropdown {
          position: absolute; background: #282828; border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5); z-index: 1001;
          animation: dropdownScaleIn 0.2s ease forwards;
        }
        .dropdown-item { height: 40px; display: flex; alignItems: center; padding: 0 16px; font-size: 13px; color: #fff; cursor: pointer; transition: background 0.2s; }
        .dropdown-item:hover { background: #333; }
        .nav-arrow-btn:hover:not(:disabled) { background: rgba(0,0,0,0.8) !important; }
        @keyframes dropdownScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
