import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHome, FiSearch, FiPlus, FiMusic, FiFolder, FiShuffle, FiX } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'
import { usePlayer } from '../../context/PlayerContext.jsx'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { playlists, isSidebarExpanded, setIsSidebarExpanded, songToAdd, setSongToAdd, addToPlaylist, createPlaylist } = usePlayer()
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    if (songToAdd && playlists.length === 0) {
      setIsCreating(true)
    }
  }, [songToAdd, playlists.length])

  const handlePlusClick = () => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true)
      setShowPlusMenu(true)
    } else {
      setIsSidebarExpanded(false)
      setShowPlusMenu(false)
    }
  }

  const handleCreatePlaylist = (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    createPlaylist(newPlaylistName)
    setNewPlaylistName('')
    setIsCreating(false)
  }

  return (
    <aside 
      className={`h-[calc(100vh-72px)] py-4 px-2 flex flex-col gap-2 flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative z-30 ${
        isSidebarExpanded ? 'w-[280px]' : 'w-[72px]'
      }`}
    >
      {/* Top Nav Box */}
      <div className="glass p-3 flex flex-col gap-2">
        <NavLink to="/" className={({isActive}) => `flex items-center gap-4 px-4 py-3 transition-all rounded-xl hover:bg-white/10 ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
          <FiHome className="text-[24px]" />
          {isSidebarExpanded && <span className="font-bold text-[15px]">Home</span>}
        </NavLink>
        <NavLink to="/search" className={({isActive}) => `flex items-center gap-4 px-4 py-3 transition-all rounded-xl hover:bg-white/10 ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
          <FiSearch className="text-[24px]" />
          {isSidebarExpanded && <span className="font-bold text-[15px]">Search</span>}
        </NavLink>
      </div>

      {/* Library Box */}
      <div className="glass p-2 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-1 mb-4">
          <button 
            onClick={handlePlusClick}
            className={`flex items-center gap-4 px-4 py-4 transition-all rounded-xl hover:bg-white/10 group ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-4">
              <VscLibrary className="text-[26px] text-white/60 group-hover:text-white" />
              {isSidebarExpanded && <span className="font-bold text-[15px]">Your Library</span>}
            </div>
            {isSidebarExpanded && <FiPlus className={`text-xl transition-transform duration-300 ${showPlusMenu ? 'rotate-45' : ''}`} />}
          </button>

          {isSidebarExpanded && (
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-2 overflow-hidden"
                >
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all mb-2 border border-dashed border-white/10"
                  >
                    <FiPlus />
                    <span className="text-sm font-medium">Create New Playlist</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {isSidebarExpanded && (
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-1">
            {isCreating && (
              <motion.form 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleCreatePlaylist}
                className="p-3 bg-white/5 rounded-xl mb-2 mx-1 border border-white/10"
              >
                <input 
                  autoFocus
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-medium mb-2 text-white"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setIsCreating(false)} className="text-[11px] font-bold text-white/40 hover:text-white">CANCEL</button>
                  <button type="submit" className="text-[11px] font-bold text-[#1DB954]">CREATE</button>
                </div>
              </motion.form>
            )}

            {songToAdd && (
              <div className="px-3 mb-3 p-3 bg-[#1DB954]/10 rounded-xl border border-[#1DB954]/20 animate-fade-in mx-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-black text-[#1DB954] tracking-widest uppercase">Select Playlist</p>
                  <FiX className="text-white/40 hover:text-white cursor-pointer" onClick={() => setSongToAdd(null)} />
                </div>
                <p className="text-[12px] text-white/70 truncate font-medium">{songToAdd.title}</p>
              </div>
            )}
            
            {playlists.map((pl) => (
              <div 
                key={pl.id} 
                onClick={() => {
                  if (songToAdd) {
                    addToPlaylist(pl.id, songToAdd)
                    setSongToAdd(null)
                  } else {
                    navigate(`/playlist/${pl.id}`)
                  }
                }}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all mx-1 active:scale-95 ${
                  location.pathname === `/playlist/${pl.id}` ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'
                } ${songToAdd ? 'ring-2 ring-[#1DB954]/30' : ''}`}
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shadow-inner overflow-hidden relative">
                  <VscLibrary className="text-white/20 text-xl" />
                  {songToAdd && (
                    <div className="absolute inset-0 bg-[#1DB954]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <FiPlus className="text-white text-xl" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-bold truncate ${location.pathname === `/playlist/${pl.id}` ? 'text-[#1DB954]' : 'text-white'}`}>{pl.name}</p>
                  <p className="text-[11px] text-white/40 truncate font-medium">{pl.songs?.length || 0} tracks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
