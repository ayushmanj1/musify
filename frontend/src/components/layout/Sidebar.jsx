import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHome, FiSearch, FiPlus, FiMusic, FiFolder, FiX, FiCheck, FiClock, FiPlay } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'
import { usePlayer } from '../../context/PlayerContext.jsx'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    playlists, 
    recentlyPlayed,
    isSidebarExpanded, 
    setIsSidebarExpanded, 
    activeSidebarTab,
    setActiveSidebarTab,
    songToAdd, 
    setSongToAdd, 
    addToPlaylist, 
    setIsSearchOpen,
    playSong,
    createPlaylist,
    removeFromHistory 
  } = usePlayer()

  const [isCreatingInline, setIsCreatingInline] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isCreatingInline && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreatingInline])

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
    if (isSidebarExpanded) setIsCreatingInline(false)
  }

  const handleTabClick = (tab) => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true)
    }
    setActiveSidebarTab(tab)
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    createPlaylist(newPlaylistName)
    setNewPlaylistName('')
    setIsCreatingInline(false)
  }

  const containerVariants = {
    expanded: { 
      width: 340,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    collapsed: { 
      width: 96,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    }
  }

  return (
    <aside className="relative z-40 h-screen flex flex-col p-4 md:p-6 select-none">
      <motion.div
        initial={false}
        animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
        variants={containerVariants}
        className="h-full rounded-[32px] flex flex-col overflow-hidden relative"
        style={{
          background: 'rgba(10, 10, 14, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Navigation */}
        <div className={`relative z-10 flex flex-col mt-10 ${isSidebarExpanded ? 'px-6 gap-2' : 'items-center gap-6'}`}>
          <NavItem 
            to="/" 
            icon={<FiHome />} 
            label="Home" 
            isExpanded={isSidebarExpanded} 
            isActive={location.pathname === '/'}
            index={0}
          />
          <NavItem 
            to="/search" 
            icon={<FiSearch />} 
            label="Search" 
            isExpanded={isSidebarExpanded} 
            isActive={location.pathname === '/search'}
            onClick={() => setIsSearchOpen(true)}
            index={1}
          />
          <NavItem 
            icon={<VscLibrary />} 
            label="Library" 
            isExpanded={isSidebarExpanded} 
            isActive={isSidebarExpanded && activeSidebarTab === 'playlists'}
            onClick={() => handleTabClick('playlists')}
            index={2}
          />
          <NavItem 
            icon={<FiClock />} 
            label="History" 
            isExpanded={isSidebarExpanded} 
            isActive={isSidebarExpanded && activeSidebarTab === 'history'}
            onClick={() => handleTabClick('history')}
            index={3}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.div
                key={activeSidebarTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col mt-10 overflow-hidden"
              >
                {activeSidebarTab === 'playlists' ? (
                  <>
                    <div className="px-8 mb-6 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[4px] text-white/10">Collections</span>
                      <button 
                        onClick={() => setIsCreatingInline(true)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lavender glass-btn"
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
                      <div className="flex flex-col gap-2">
                        <AnimatePresence>
                          {isCreatingInline && (
                            <motion.form
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              onSubmit={handleCreateSubmit}
                              className="px-2 mb-4"
                            >
                              <div className="relative">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={newPlaylistName}
                                  onChange={(e) => setNewPlaylistName(e.target.value)}
                                  placeholder="New Playlist"
                                  className="w-full rounded-2xl px-5 py-4 bg-white/5 border border-white/5 text-white font-bold outline-none focus:border-lavender/30 transition-all"
                                />
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>

                        {playlists.map((pl) => (
                          <PlaylistItem 
                            key={pl.id}
                            playlist={pl} 
                            isActive={location.pathname === `/playlist/${pl.id}`}
                            onClick={() => navigate(`/playlist/${pl.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-8 mb-6 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[4px] text-white/10">Recents</span>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
                      <div className="flex flex-col gap-2">
                        {recentlyPlayed.map((song) => (
                          <HistoryItem 
                            key={`${song.videoId}-${song.playedAt}`}
                            song={song}
                            onClick={() => playSong(song)}
                            onRemove={() => removeFromHistory(song.videoId, song.playedAt)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expansion Toggle */}
        <div className="p-6 flex justify-center mt-auto border-t border-white/5">
          <button 
            onClick={toggleSidebar}
            className="w-full h-12 rounded-2xl glass-btn flex items-center justify-center transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <FiPlus className={`text-white/30 transition-transform duration-300 ${isSidebarExpanded ? 'rotate-45' : ''}`} size={20} />
              {isSidebarExpanded && <span className="text-sm font-bold text-white/30">Minimize</span>}
            </div>
          </button>
        </div>
      </motion.div>
    </aside>
  )
}

function NavItem({ to, icon, label, isExpanded, isActive, onClick, index }) {
  const content = (
    <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all relative z-10 active:scale-[0.95] group ${
      isActive ? 'text-white bg-white/10 shadow-lg' : 'text-white/30 hover:text-white/60'
    }`}>
      <div className={`text-2xl transition-transform duration-300 ${isActive ? 'text-lavender scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="font-bold text-base tracking-tight"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="relative w-full cursor-pointer" onClick={onClick}>
      {to ? <NavLink to={to} className="block w-full">{content}</NavLink> : <div className="block w-full">{content}</div>}
    </div>
  )
}

function PlaylistItem({ playlist, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
        isActive ? 'bg-lavender/10 border border-lavender/20' : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04]'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        isActive ? 'bg-lavender text-white' : 'bg-white/5 text-white/20'
      }`}>
        <FiMusic size={18} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-white/70'}`}>{playlist.name}</p>
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-[2px]">{playlist.songs?.length || 0} Tracks</p>
      </div>
    </div>
  )
}

function HistoryItem({ song, onClick, onRemove }) {
  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all active:scale-[0.98] relative bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] pr-10"
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
        <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-white/80 truncate leading-tight">{song.title}</p>
        <p className="text-[10px] font-medium text-white/20 truncate">{song.artist}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white/10 hover:text-white hover:bg-red-500/40 opacity-0 group-hover:opacity-100 transition-all"
      >
        <FiX size={12} />
      </button>
    </div>
  )
}
