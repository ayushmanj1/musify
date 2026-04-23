import { motion } from 'framer-motion'
import { FiPlay, FiHeart, FiMoreHorizontal, FiPlus, FiTrash2, FiDownload } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { useState, useRef, useEffect, memo } from 'react'

const SongRow = memo(({ song, songs = [], index = 0, showIndex = false, onRemove = null, compact = false }) => {
  const { playSong, currentSong, isPlaying, toggleSavedSong, isSongSaved, playlists, addToPlaylist, addToQueue, downloadSong } = usePlayer()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const isActive = currentSong?.videoId === song.videoId

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handlePlay = (e) => {
    e.stopPropagation()
    playSong(song, songs.length > 0 ? songs : [song], songs.length > 0 ? index : 0)
  }

  // Optimized for performance: Simple background change instead of heavy blur on every row
  const rowStyle = {
    background: isActive ? 'rgba(167,139,250,0.08)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(167,139,250,0.15)' : 'transparent'}`
  }

  if (compact) {
    return (
      <div
        onClick={handlePlay}
        className="group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/[0.04]"
        style={rowStyle}
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
          <img src={song.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isActive ? 'text-lavender' : 'text-white/80'}`}>{song.title}</p>
          <p className="text-[11px] text-white/30 truncate uppercase tracking-wider">{song.artist}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handlePlay}
      className="group grid grid-cols-[50px_1fr_40px] md:grid-cols-[50px_1fr_80px_40px] items-center px-4 py-3 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.03] active:scale-[0.99] song-row-hover"
      style={rowStyle}
    >
      <div className={`text-[13px] font-black tracking-tight flex justify-center ${isActive ? 'text-lavender' : 'text-white/10 group-hover:text-white/30'}`}>
        {isActive && isPlaying ? (
          <div className="flex gap-[2px] items-end h-3 mb-1">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i} 
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                className="w-[2px] bg-lavender rounded-full" 
              />
            ))}
          </div>
        ) : (showIndex ? index + 1 : '')}
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
          <img src={song.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <FiPlay className="text-white text-xl fill-current" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-[15px] font-bold tracking-tight truncate leading-tight mb-1 ${isActive ? 'text-lavender' : 'text-white/90'}`}>
            {song.title}
          </h4>
          <p className="text-[12px] text-white/30 font-bold truncate uppercase tracking-widest">{song.artist || song.channelTitle}</p>
        </div>
      </div>

      <div className="hidden md:block text-right pr-6">
        <span className="text-[12px] font-bold text-white/20 tabular-nums group-hover:text-white/40 transition-colors">3:45</span>
      </div>

      <div className="relative" ref={menuRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/10 hover:text-white hover:bg-white/5 transition-all"
        >
          <FiMoreHorizontal size={20} />
        </button>
        
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute right-0 bottom-12 md:bottom-auto md:top-12 z-[100] w-64 p-2 rounded-[24px] glass-panel shadow-2xl border border-white/10"
            style={{ background: 'rgba(10,10,14,0.95)', backdropFilter: 'blur(30px)' }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSavedSong(song); setShowMenu(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold text-white/70 hover:text-white transition-all"
            >
              <FiHeart className={isSongSaved(song.videoId) ? 'text-lavender fill-current' : ''} />
              {isSongSaved(song.videoId) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); addToQueue(song); setShowMenu(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold text-white/70 hover:text-white transition-all"
            >
              <FiPlus /> Add to Queue
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); downloadSong(song); setShowMenu(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold text-white/70 hover:text-white transition-all"
            >
              <FiDownload /> Download Song
            </button>
            
            <div className="h-px bg-white/5 my-2 mx-2" />
            <div className="px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Collections</div>
            
            {playlists.map(pl => (
              <button 
                key={pl.id}
                onClick={(e) => { e.stopPropagation(); addToPlaylist(pl.id, song); setShowMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold text-white/70 hover:text-white transition-all"
              >
                <FiMusic /> {pl.name}
              </button>
            ))}

            {onRemove && (
              <>
                <div className="h-px bg-white/5 my-2 mx-2" />
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(song.videoId); setShowMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-sm font-bold text-red-400 transition-all"
                >
                  <FiTrash2 /> Remove from Collection
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
})

export default SongRow
