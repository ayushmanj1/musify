import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { FiHome as IconHome, FiSearch as IconSearch, FiBook as IconLibrary, FiDisc as IconPlaylist, FiPlus as IconPlus, FiX, FiCheck } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import toast from 'react-hot-toast'

export default function LeftSidebar() {
  const { 
    userPlaylists, setUserPlaylists, addSongToPlaylist, updatePlaylist,
    isLeftSidebarCollapsed, setIsLeftSidebarCollapsed
  } = usePlayer()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState(null)
  const [newPlaylistName, setNewPlaylistName] = useState('My Playlist #1')
  const [newPlaylistSongs, setNewPlaylistSongs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isReady, setIsReady] = useState(false)

  // Handle initial load transition-none
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  const masterSongsList = [
    { videoId: 'm1', title: 'Midnight City', artist: 'M83', duration: 243, thumbnail: 'https://i.ytimg.com/vi/dX3k_LSd3YY/mqdefault.jpg' },
    { videoId: 'm2', title: 'Starboy', artist: 'The Weeknd', duration: 230, thumbnail: 'https://i.ytimg.com/vi/34Na4j8HLjc/mqdefault.jpg' },
    { videoId: 'm3', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
    { videoId: 'm4', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/mqdefault.jpg' },
    { videoId: 'm5', title: 'Save Your Tears', artist: 'The Weeknd', duration: 215, thumbnail: 'https://i.ytimg.com/vi/XXYlCGtcZ1Q/mqdefault.jpg' },
    { videoId: 'm6', title: 'As It Was', artist: 'Harry Styles', duration: 167, thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/mqdefault.jpg' },
    { videoId: 'm7', title: 'Good 4 U', artist: 'Olivia Rodrigo', duration: 178, thumbnail: 'https://i.ytimg.com/vi/gNi_6U5Pm_o/mqdefault.jpg' },
    { videoId: 'm8', title: 'Stay', artist: 'The Kid LAROI', duration: 141, thumbnail: 'https://i.ytimg.com/vi/kTJczUoc26U/mqdefault.jpg' }
  ]

  const handleCreateClick = () => {
    setIsModalOpen(true)
    setEditingPlaylist(null)
    setNewPlaylistName(`My Playlist #${userPlaylists.length + 1}`)
    setNewPlaylistSongs([])
    setSearchQuery('')
  }

  const handleEditClick = (playlistName) => {
    const pl = userPlaylists.find(p => p.name === playlistName)
    if (!pl) return
    setIsModalOpen(true)
    setEditingPlaylist(playlistName)
    setNewPlaylistName(pl.name)
    setNewPlaylistSongs(pl.songs || [])
    setSearchQuery('')
  }

  const handleSavePlaylist = () => {
    const finalName = newPlaylistName.trim() || `My Playlist #${userPlaylists.length + 1}`
    
    if (editingPlaylist) {
      updatePlaylist(editingPlaylist, { name: finalName, songs: newPlaylistSongs })
      if (editingPlaylist !== finalName) {
        navigate(`/playlist/${encodeURIComponent(finalName)}`)
      }
    } else {
      const newPlaylistObj = { 
        name: finalName, 
        songs: newPlaylistSongs, 
        cover: '🎵', 
        color: `hsl(${Math.random() * 360}, 50%, 30%)`
      }
      setUserPlaylists(prev => [newPlaylistObj, ...prev])
      toast.success(`Playlist '${finalName}' created!`)
      navigate(`/playlist/${encodeURIComponent(finalName)}`)
    }
    setIsModalOpen(false)
  }

  useEffect(() => {
    const onOpen = () => handleCreateClick()
    const onEdit = (e) => handleEditClick(e.detail.playlistName)
    const onAdd = (e) => addSongToPlaylist(e.detail.playlistName, e.detail.song)
    const onDeleted = () => navigate('/')

    window.addEventListener('open-create-playlist', onOpen)
    window.addEventListener('open-edit-playlist', onEdit)
    window.addEventListener('add-song-to-playlist', onAdd)
    window.addEventListener('playlist-deleted', onDeleted)

    return () => {
      window.removeEventListener('open-create-playlist', onOpen)
      window.removeEventListener('open-edit-playlist', onEdit)
      window.removeEventListener('add-song-to-playlist', onAdd)
      window.removeEventListener('playlist-deleted', onDeleted)
    }
  }, [userPlaylists, addSongToPlaylist])

  const onPlaylistContextMenu = (e, name) => {
    e.preventDefault()
    if (name === 'Liked Songs') return
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: e.clientX, y: e.clientY, type: 'playlist', playlistName: name }
    }))
  }

  const navItems = [
    { path: '/', label: 'Home', Icon: IconHome },
    { path: '/search', label: 'Search', Icon: IconSearch },
    { path: '/library', label: 'Your Library', Icon: IconLibrary },
  ]

  return (
    <div className="left-sidebar" style={{ 
      padding: isLeftSidebarCollapsed ? '24px 0' : '24px 12px', 
      position: 'relative',
      width: '100%',
      height: '100%',
      transition: isReady ? (isLeftSidebarCollapsed ? 'width 0.35s cubic-bezier(0.4,0,0.2,1)' : 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)') : 'none',
      borderRight: isLeftSidebarCollapsed ? '2px solid #8B5CF6' : 'none',
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* Top Header Row (Logo + Collapse Arrow) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: isLeftSidebarCollapsed ? 'center' : 'space-between',
        padding: isLeftSidebarCollapsed ? '0' : '0 12px', marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px', color: '#8B5CF6', fontWeight: 900 }}>♪</span>
          {!isLeftSidebarCollapsed && (
            <span style={{ 
              fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
              opacity: isLeftSidebarCollapsed ? 0 : 1,
              transition: 'opacity 0.15s ease'
            }}>Musify</span>
          )}
        </div>
        {!isLeftSidebarCollapsed && (
          <button 
            onClick={() => setIsLeftSidebarCollapsed(true)}
            title="Collapse sidebar"
            className="collapse-btn"
            style={{
              background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer',
              padding: '4px 6px', borderRadius: '6px', marginLeft: 'auto'
            }}
          >
            ❯
          </button>
        )}
      </div>

      {/* Nav Group */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '8px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        padding: isLeftSidebarCollapsed ? '0' : '8px 12px', marginBottom: '8px'
      }}>
        {navItems.map(({ path, label, Icon }) => {
          const isActive = pathname === path
          return (
            <NavLink 
              key={path}
              to={path} 
              title={isLeftSidebarCollapsed ? label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '10px 12px', textDecoration: 'none',
                justifyContent: isLeftSidebarCollapsed ? 'center' : 'flex-start',
                color: isActive ? '#8B5CF6' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600,
                borderRadius: '8px', transition: 'all 0.2s ease',
                margin: isLeftSidebarCollapsed ? '0 6px' : '0'
              }}
              className="nav-link-hover"
            >
              <Icon size={isLeftSidebarCollapsed ? 20 : 24} />
              {!isLeftSidebarCollapsed && (
                <span className="sidebar-text" style={{ 
                  fontSize: '14px',
                  opacity: isLeftSidebarCollapsed ? 0 : 1,
                  transition: isLeftSidebarCollapsed ? 'opacity 0.15s ease' : 'opacity 0.2s ease 0.2s'
                }}>{label}</span>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Library Group */}
      {!isLeftSidebarCollapsed ? (
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '8px', flex: 1,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          opacity: isLeftSidebarCollapsed ? 0 : 1,
          transition: isLeftSidebarCollapsed ? 'opacity 0.15s ease' : 'opacity 0.2s ease 0.2s'
        }}>
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 700, cursor: 'pointer' }} className="hover-text-primary">
              <IconPlaylist size={24} />
              <span className="sidebar-text" style={{ fontSize: '14px' }}>Playlists</span>
            </div>
            <button onClick={handleCreateClick} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} className="sidebar-text hover-text-primary">
              <IconPlus size={20} />
            </button>
          </div>

          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {userPlaylists.map((playlist, i) => {
              const name = playlist.name
              const urlName = encodeURIComponent(name)
              const isLiked = name === 'Liked Songs'
              
              return (
                <NavLink
                  key={i}
                  to={`/playlist/${urlName}`}
                  onContextMenu={(e) => onPlaylistContextMenu(e, name)}
                  className={({ isActive }) => "sidebar-playlist " + (isActive ? "active" : "")}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '4px', textDecoration: 'none',
                    transition: 'all 0.3s ease', marginBottom: '4px'
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', 
                    background: playlist.color || '#282828',
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '20px', fontWeight: 700, flexShrink: 0
                  }}>
                    {isLiked ? '💜' : name.charAt(0).toUpperCase()}
                  </div>
                  <div className="sidebar-text" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="truncate" style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{name}</span>
                    <span className="truncate" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Playlist • {playlist.songs?.length || 0} songs</span>
                  </div>
                </NavLink>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingBottom: '24px' }}>
          <button 
            onClick={() => setIsLeftSidebarCollapsed(false)}
            title="Expand sidebar"
            className="collapse-btn"
            style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '12px' }}
          >
            ❮
          </button>
        </div>
      )}

      {/* ─── CREATE/EDIT PLAYLIST MODAL ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease'
        }} onMouseDown={() => setIsModalOpen(false)}>
          
          <div style={{
            background: '#121212', borderRadius: '16px', width: '520px', maxHeight: '80vh',
            overflowY: 'auto', padding: 0, position: 'relative',
            animation: 'modalScaleIn 0.25s ease', boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
          }} className="hide-scrollbar" onMouseDown={e => e.stopPropagation()}>
            
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', zIndex: 10 }}>
              <FiX size={24} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
                <div style={{ width: '140px', height: '140px', background: '#282828', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '48px', color: '#b3b3b3' }}>🎵</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '8px' }}>
                  <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #535353', color: '#fff', fontSize: '22px', fontWeight: 700, outline: 'none', paddingBottom: '4px', marginBottom: '12px', width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSavePlaylist} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '24px', padding: '10px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #282828', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 16px' }}>
                  <p style={{ color: '#b3b3b3', fontSize: '13px', fontWeight: 600, margin: 0 }}>Find something for your playlist</p>
                  <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 700 }}>Added ({newPlaylistSongs.length})</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <IconSearch size={18} color="#b3b3b3" style={{ position: 'absolute', top: '10px', left: '12px' }} />
                  <input type="text" placeholder="Search for songs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', background: '#242424', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '14px', padding: '10px 10px 10px 40px', outline: 'none' }} />
                </div>
                
                {masterSongsList
                  .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((song, i) => {
                  const added = newPlaylistSongs.some(s => s.videoId === song.videoId)
                  return (
                    <div key={song.videoId} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px' }} className="hover-bg-card">
                      <img src={song.thumbnail} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', marginRight: '12px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="truncate" style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{song.title}</p>
                        <p className="truncate" style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>{song.artist}</p>
                      </div>
                      <button onClick={() => { if(!added) setNewPlaylistSongs(p => [...p, song]); else setNewPlaylistSongs(p => p.filter(s => s.videoId !== song.videoId)) }}
                        style={{ background: 'none', border: added ? '1px solid #8B5CF6' : '1px solid #535353', borderRadius: '24px', color: added ? '#8B5CF6' : '#fff', padding: '4px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', minWidth: '80px' }}>
                        {added ? 'Added' : 'Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .collapse-btn:hover { color: #fff !important; }
        .hover-text-primary:hover { color: #fff !important; }
        .sidebar-playlist:hover { background: rgba(255,255,255,0.05); }
        .sidebar-playlist.active { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .hover-bg-card:hover { background: #282828; }
        .nav-link-hover:hover { background: #282828; color: #fff !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
