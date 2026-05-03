import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  FiHome as IconHome, FiSearch as IconSearch, FiBook as IconLibrary, 
  FiDisc as IconPlaylist, FiPlus as IconPlus, FiChevronDown, FiChevronRight
} from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function LeftSidebar() {
  const { 
    userPlaylists, isLeftSidebarCollapsed, setIsLeftSidebarCollapsed
  } = usePlayer()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isReady, setIsReady] = useState(false)
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleCreateClick = () => {
    window.dispatchEvent(new CustomEvent('open-create-playlist'))
  }

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
      
      {/* Top Header Row */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: isLeftSidebarCollapsed ? 'center' : 'space-between',
        padding: isLeftSidebarCollapsed ? '0' : '0 12px', marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px', color: '#8B5CF6', fontWeight: 900 }}>♪</span>
          {!isLeftSidebarCollapsed && (
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Musify</span>
          )}
        </div>
        {!isLeftSidebarCollapsed && (
          <button onClick={() => setIsLeftSidebarCollapsed(true)} className="collapse-btn" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}>❯</button>
        )}
      </div>

      {/* Nav Group */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', padding: isLeftSidebarCollapsed ? '0' : '8px 12px', marginBottom: '8px' }}>
        {navItems.map(({ path, label, Icon }) => {
          const isActive = pathname === path
          return (
            <NavLink 
              key={path} to={path} title={isLeftSidebarCollapsed ? label : ''}
              className="nav-link-hover"
              style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', textDecoration: 'none',
                justifyContent: isLeftSidebarCollapsed ? 'center' : 'flex-start',
                color: isActive ? '#8B5CF6' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600, borderRadius: '8px', transition: 'all 0.2s ease'
              }}
            >
              <Icon size={isLeftSidebarCollapsed ? 20 : 24} />
              {!isLeftSidebarCollapsed && <span style={{ fontSize: '14px' }}>{label}</span>}
            </NavLink>
          )
        })}
      </div>

      {/* Library Group */}
      {!isLeftSidebarCollapsed ? (
        <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <div onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 700, cursor: 'pointer' }} className="hover-text-primary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconPlaylist size={24} />
                {isPlaylistsExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </div>
              <span style={{ fontSize: '14px' }}>Playlists</span>
            </div>
            <button onClick={handleCreateClick} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} className="hover-text-primary">
              <IconPlus size={20} />
            </button>
          </div>

          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isPlaylistsExpanded ? '8px 12px' : '0 12px', maxHeight: isPlaylistsExpanded ? '1000px' : '0', transition: 'all 0.3s ease' }}>
            {userPlaylists.map((playlist, i) => {
              const name = playlist.name
              const isLiked = name === 'Liked Songs'
              return (
                <NavLink
                  key={i} to={`/playlist/${encodeURIComponent(name)}`}
                  onContextMenu={(e) => onPlaylistContextMenu(e, name)}
                  className={({ isActive }) => "sidebar-playlist " + (isActive ? "active" : "")}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none', marginBottom: '4px' }}
                >
                  <div style={{ width: '48px', height: '48px', background: playlist.color || '#282828', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 700 }}>
                    {isLiked ? '💜' : name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
          <button onClick={() => setIsLeftSidebarCollapsed(false)} className="collapse-btn" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '12px' }}>❮</button>
        </div>
      )}

      <style>{`
        .collapse-btn:hover { color: #fff !important; }
        .hover-text-primary:hover { color: #fff !important; }
        .sidebar-playlist:hover { background: rgba(255,255,255,0.05); }
        .sidebar-playlist.active { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .nav-link-hover:hover { background: #282828; color: #fff !important; }
      `}</style>
    </div>
  )
}
