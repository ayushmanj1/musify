import { motion } from 'framer-motion'
import { FiPlay, FiHeart, FiMoreHorizontal, FiPlus } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { useState, useRef, useEffect } from 'react'

export default function SongRow({ song, songs = [], index = 0, showIndex = false, onRemove = null, compact = false }) {
  const { playSong, currentSong, isPlaying, toggleSavedSong, isSongSaved, playlists, addToPlaylist, addToQueue } = usePlayer()
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

  // Compact variant (for recently played grid on home)
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => playSong(song, songs.length > 0 ? songs : [song], songs.length > 0 ? index : 0)}
        className={`group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.02] hover:border-white/[0.08] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 h-[60px] shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] backdrop-blur-md ${isActive ? 'bg-white/[0.06] border-white/[0.1]' : ''}`}
      >
        <img src={song.thumbnail} alt="" className="w-15 h-15 object-cover flex-shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.2)]" />
        <span className={`text-[13px] font-bold tracking-tight truncate pr-3 ${isActive ? 'text-accent' : 'text-white/90 group-hover:text-white'}`}>
          {song.title}
        </span>
        <div className="ml-auto pr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); playSong(song, songs, index) }}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg"
          >
            <FiPlay className="text-white text-sm ml-0.5" fill="white" strokeWidth={0} />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Full row variant
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02, ease: "easeOut" }}
      className={`group flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-transparent hover:border-white/[0.05] ${isActive ? 'bg-white/[0.04] border-white/[0.02]' : ''}`}
      onClick={() => playSong(song, songs.length > 0 ? songs : [song], songs.length > 0 ? index : 0)}
    >
      {showIndex && (
        <span className={`w-5 text-center text-[13px] font-medium ${isActive ? 'text-accent' : 'text-white/40 group-hover:text-white/80'}`}>
          {isActive && isPlaying ? (
            <div className="flex gap-[3px] items-end justify-center h-3.5">
              {[1, 2, 3].map(i => (
                <motion.div key={i} className="w-[3px] bg-accent rounded-full"
                  animate={{ height: [3, 12, 3] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : index + 1}
        </span>
      )}

      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        <img src={song.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
           <FiPlay className="text-white text-lg ml-0.5" fill="white" strokeWidth={0} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-[14.5px] font-bold tracking-tight truncate mb-0.5 ${isActive ? 'text-accent' : 'text-white/90 group-hover:text-white'}`}>
          {song.title}
        </h4>
        <p className="text-[12px] text-white/50 font-medium truncate group-hover:text-white/70 transition-colors">{song.artist || song.channelTitle || 'Unknown'}</p>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); toggleSavedSong(song) }}
          className="text-white/40 hover:text-white transition-colors">
          <FiHeart className={`text-base ${isSongSaved(song.videoId) ? 'text-pink-500 fill-pink-500' : ''}`} />
        </motion.button>

        {onRemove && (
          <button onClick={(e) => { e.stopPropagation(); onRemove(song.videoId) }}
            className="text-white/40 hover:text-red-400 text-sm transition-colors p-1">✕</button>
        )}

        <div className="relative" ref={menuRef}>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="text-white/40 hover:text-white transition-colors p-1">
            <FiMoreHorizontal className="text-lg" />
          </motion.button>
          {showMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 top-8 z-50 w-52 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <button onClick={(e) => { e.stopPropagation(); addToQueue(song); setShowMenu(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-white/90 font-medium hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-3 transition-colors">
                <FiPlus className="text-white/50 text-lg" /> Add to queue
              </button>
              <div className="h-px bg-white/10 my-1.5 mx-2" />
              <div className="px-4 py-1.5 text-xs font-bold text-white/40 uppercase tracking-wider">Add to Playlist</div>
              {playlists.map(pl => (
                <button key={pl.id} onClick={(e) => { e.stopPropagation(); addToPlaylist(pl.id, song); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/90 font-medium hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-3 transition-colors">
                  <FiPlus className="text-white/50 text-lg" /> {pl.name}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
