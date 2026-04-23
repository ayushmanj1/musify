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
      width: 360,
      transition: { type: 'spring', damping: 25, stiffness: 180 }
    },
    collapsed: { 
      width: 104,
      transition: { type: 'spring', damping: 25, stiffness: 250 }
    }
  }

  return (
    <aside className="relative z-50 h-screen flex flex-col p-6 select-none">
      <motion.div
        initial={false}
        animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
        variants={containerVariants}
        className="bg-[#0a0a0a] h-full rounded-[48px] border border-white/10 flex flex-col overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative"
      >
        {/* TOP SECTION: Navigation (Always anchored) */}
        <div className={`relative z-10 flex flex-col mt-12 ${isSidebarExpanded ? 'px-8 gap-4' : 'items-center gap-10'}`}>
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

        {/* MIDDLE SECTION: Dynamic Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.div
                key={activeSidebarTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'circOut' }}
                className="flex-1 flex flex-col mt-16 overflow-hidden"
              >
                {activeSidebarTab === 'playlists' ? (
                  <>
                    <div className="px-10 mb-8 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[5px] text-white/20">Collections</span>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCreatingInline(true)}
                        className="w-12 h-12 rounded-2xl bg-lavender/10 flex items-center justify-center text-lavender border border-lavender/20 shadow-[0_0_20px_rgba(167,139,250,0.1)]"
                      >
                        <FiPlus size={24} />
                      </motion.button>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-8 pb-8">
                      <div className="flex flex-col gap-4">
                        <AnimatePresence>
                          {isCreatingInline && (
                            <motion.form
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              onSubmit={handleCreateSubmit}
                              className="px-2 mb-8"
                            >
                              <div className="relative group">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={newPlaylistName}
                                  onChange={(e) => setNewPlaylistName(e.target.value)}
                                  placeholder="Playlist name..."
                                  className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-6 text-white text-base font-bold outline-none focus:border-lavender/50 focus:bg-lavender/5 transition-all pr-16"
                                />
                                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-lavender text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                  <FiCheck size={20} />
                                </button>
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
                    <div className="px-10 mb-8 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[5px] text-white/20">Recents</span>
                      <FiClock className="text-white/20" size={18} />
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-8 pb-8">
                      <div className="flex flex-col gap-4">
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

        {/* BOTTOM SECTION: Expansion Toggle */}
        <div className="p-8 flex justify-center mt-auto border-t border-white/5 bg-black/20">
          <button 
            onClick={toggleSidebar}
            className="w-full h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group"
          >
            <motion.div
              animate={{ rotate: isSidebarExpanded ? 180 : 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="flex items-center gap-3"
            >
              <FiPlus className={`text-white transition-all ${isSidebarExpanded ? 'rotate-45 text-lavender' : ''}`} size={24} />
              {isSidebarExpanded && <span className="text-sm font-bold text-white/60">Minimize</span>}
            </motion.div>
          </button>
        </div>
      </motion.div>
    </aside>
  )
}

function NavItem({ to, icon, label, isExpanded, isActive, onClick, index }) {
  const content = (
    <div className={`flex items-center gap-6 p-6 rounded-[32px] transition-all duration-300 relative z-10 active:scale-90 overflow-hidden group ${
      isActive 
      ? 'bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
      : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}>
      {/* Shimmer Effect */}
      <div className="shimmer-sweep" />

      <div className={`text-[28px] transition-all duration-300 ${isActive ? 'scale-110 text-lavender' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            className="font-black text-[18px] tracking-tight whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {to ? (
        <NavLink to={to} className="block w-full">{content}</NavLink>
      ) : (
        <div className="block w-full">{content}</div>
      )}

      {/* Glow Indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            layoutId="active-pill"
            className="absolute inset-0 bg-lavender/5 rounded-[32px] border border-lavender/20 -z-0"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PlaylistItem({ playlist, isActive, onClick }) {
  return (
    <motion.div 
      layout
      onClick={onClick}
      className={`group flex items-center gap-5 p-5 rounded-[32px] cursor-pointer transition-all duration-300 active:scale-[0.98] relative overflow-hidden ${
        isActive 
        ? 'bg-lavender/10 border border-lavender/20 shadow-xl' 
        : 'bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="shimmer-sweep" />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        isActive ? 'bg-lavender text-black shadow-[0_0_20px_rgba(167,139,250,0.4)]' : 'bg-white/5 text-white/20 group-hover:text-white/60'
      }`}>
        <FiMusic size={26} />
      </div>

      <div className="min-w-0">
        <p className={`text-[16px] font-black truncate transition-colors ${
          isActive ? 'text-white' : 'text-white/80'
        }`}>
          {playlist.name}
        </p>
        <p className="text-[12px] font-black text-white/20 uppercase tracking-[4px] mt-1">
          {playlist.songs?.length || 0} Tracks
        </p>
      </div>
    </motion.div>
  )
}

function HistoryItem({ song, onClick, onRemove }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-[28px] bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all active:scale-[0.98] relative pr-12 overflow-hidden"
    >
      <div className="shimmer-sweep" />

      <div className="w-12 h-12 rounded-xl overflow-hidden relative shadow-md flex-shrink-0">
        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <FiPlay className="text-white text-xs fill-current" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-black text-white/90 truncate leading-tight">{song.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[11px] font-bold text-white/30 truncate max-w-[100px]">{song.artist}</p>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <p className="text-[10px] font-black text-lavender/40 uppercase tracking-widest">
            {new Date(song.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500/80 hover:border-red-500/50 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
      >
        <FiX size={16} />
      </button>
    </motion.div>
  )
}



