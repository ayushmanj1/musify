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
      width: 320,
      transition: { type: 'spring', damping: 22, stiffness: 180 }
    },
    collapsed: { 
      width: 104,
      transition: { type: 'spring', damping: 25, stiffness: 250 }
    }
  }

  return (
    <aside className="relative z-50 h-[calc(100vh-80px)] flex flex-col p-4 select-none">
      <motion.div
        initial={false}
        animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
        variants={containerVariants}
        className="glass-morphism h-full rounded-[48px] border border-white/10 flex flex-col overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative noise-overlay"
      >
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#1DB954]/5 blur-[120px] pointer-events-none" />

        {/* TOP SPACE (for vertical symmetry of the 4 icons) */}
        {!isSidebarExpanded && <div className="flex-1" />}

        {/* MAIN NAVIGATION (4 Icons Centered) */}
        <div className={`relative z-10 flex flex-col ${isSidebarExpanded ? 'mt-10 px-6 gap-3' : 'gap-10 items-center'}`}>
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
            label="Playlists" 
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

        {/* DYNAMIC CONTENT AREA (Expanded Mode) */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.div
                key={activeSidebarTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 flex flex-col mt-10 overflow-hidden"
              >
                {activeSidebarTab === 'playlists' ? (
                  <>
                    <div className="px-10 mb-6 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[5px] text-white/20">Your Collections</span>
                      <button 
                        onClick={() => setIsCreatingInline(true)}
                        className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#1DB954] hover:bg-[#1DB954]/10 transition-all active:scale-90"
                      >
                        <FiPlus size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
                      <div className="flex flex-col gap-3">
                        <AnimatePresence>
                          {isCreatingInline && (
                            <motion.form
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              onSubmit={handleCreateSubmit}
                              className="px-2 mb-4"
                            >
                              <div className="relative group">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={newPlaylistName}
                                  onChange={(e) => setNewPlaylistName(e.target.value)}
                                  placeholder="New Playlist..."
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all pr-12"
                                />
                                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1DB954] hover:scale-125 transition-transform">
                                  <FiCheck size={22} />
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>

                        {playlists.map((pl, i) => (
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
                    <div className="px-10 mb-6 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[5px] text-white/20">Recently Played</span>
                      <FiClock className="text-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
                      <div className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                          {recentlyPlayed.map((song, i) => (
                            <HistoryItem 
                              key={`${song.videoId}-${song.playedAt}`}
                              song={song}
                              onClick={() => playSong(song)}
                              onRemove={() => removeFromHistory(song.videoId, song.playedAt)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM SPACE / TOGGLE (For symmetry and control) */}
        <div className={`p-8 flex justify-center relative z-20 ${!isSidebarExpanded ? 'flex-1 items-end' : ''}`}>
          <button 
            onClick={toggleSidebar}
            className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all group premium-glow shadow-2xl"
          >
            <motion.div
              animate={{ rotate: isSidebarExpanded ? 45 : 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            >
              <FiPlus className="text-white text-3xl" />
            </motion.div>
          </button>
        </div>
      </motion.div>
    </aside>
  )
}

function NavItem({ to, icon, label, isExpanded, isActive, onClick, index }) {
  const content = (
    <div className={`flex items-center gap-6 p-5 rounded-[28px] transition-all duration-300 relative z-10 active:scale-90 ${
      isActive 
      ? 'bg-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
      : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}>
      <div className={`text-2xl transition-all duration-300 ${isActive ? 'scale-110 text-[#1DB954]' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            className="font-bold text-[16px] tracking-tight whitespace-nowrap"
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
            className="absolute inset-0 bg-[#1DB954]/5 rounded-[28px] border border-[#1DB954]/20 -z-0"
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
      className={`group flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.98] ${
        isActive 
        ? 'bg-[#1DB954]/10 border border-[#1DB954]/20 shadow-lg' 
        : 'bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        isActive ? 'bg-[#1DB954] text-black shadow-[0_0_15px_rgba(29,185,84,0.3)]' : 'bg-white/5 text-white/20 group-hover:text-white/60'
      }`}>
        <FiMusic size={22} />
      </div>

      <div className="min-w-0">
        <p className={`text-[15px] font-bold truncate transition-colors ${
          isActive ? 'text-white' : 'text-white/70'
        }`}>
          {playlist.name}
        </p>
        <p className="text-[11px] font-black text-white/20 uppercase tracking-[3px] mt-0.5">
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
      className="group flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all active:scale-[0.98] relative pr-10"
    >
      {/* Smaller, sharper thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden relative shadow-md flex-shrink-0">
        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <FiPlay className="text-white text-xs fill-current" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-white/90 truncate leading-tight">{song.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] font-medium text-white/30 truncate max-w-[80px]">{song.artist}</p>
          <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
          <p className="text-[9px] font-bold text-[#1DB954]/40 uppercase tracking-wider">
            {new Date(song.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Circular Premium Delete Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500/80 hover:border-red-500/50 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
      >
        <FiX size={14} />
      </button>
    </motion.div>
  )
}



