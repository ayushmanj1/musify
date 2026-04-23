import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiPlay, FiPlus, FiMusic } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { enrichSongMetadata } from '../../utils/api.js'

export default function SongCard({ 
  song: initialSong, 
  songs = [], 
  index = 0, 
  isArtist = false, 
  isChart = false,
  showProgress = false,
  isNew = false,
  rank = null,
  isLarge = false
}) {
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying, setIsSidebarExpanded, setSongToAdd, currentTime, duration } = usePlayer()
  const [song, setSong] = useState(initialSong)
  const [isEnriching, setIsEnriching] = useState(false)
  
  useEffect(() => {
    // Only enrich if it's not already enriched and it's a song (not an artist card)
    if (!initialSong.isEnriched && initialSong.title && !isArtist && !isChart) {
      setIsEnriching(true)
      enrichSongMetadata(initialSong).then(enriched => {
        setSong(enriched)
        setIsEnriching(false)
      })
    } else {
      setSong(initialSong)
    }
  }, [initialSong, isArtist, isChart])

  const isCurrent = currentSong?.videoId === song.videoId
  const isActive = isCurrent && isPlaying
  const progress = isCurrent ? (currentTime / duration) * 100 : (song.lastProgress || 0)

  // Frontend safety filter for Shorts
  const lowerTitle = (song.title || "").toLowerCase()
  if (lowerTitle.includes("shorts") || lowerTitle.includes("#shorts") || ["trailer", "teaser", "reaction"].some(word => lowerTitle.includes(word))) {
    return null
  }

  const handleClick = () => {
    if (isChart) {
      navigate(`/charts/${encodeURIComponent(song.title || song.id)}`)
      return
    }

    if (isArtist) {
      navigate(`/artist/${encodeURIComponent(song.title || song.name)}`)
      return
    }
    
    if (song.videoId) {
      playSong(song, songs.length > 0 ? songs : [song], index)
    }
  }

  const handlePlus = (e) => {
    e.stopPropagation()
    setSongToAdd(song)
    setIsSidebarExpanded(true)
  }

  const displayImage = song.albumArt || song.thumbnail

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        delay: index * 0.03, 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      onClick={handleClick}
      className={`
        w-[160px] md:w-full
        p-3 md:p-4 rounded-[28px] 
        bg-[#111]
        border border-white/5
        hover:border-lavender/30
        hover:scale-[1.02]
        ${isActive ? 'active-playing-border' : ''}
        transition-all duration-300 ease-out
        cursor-pointer group flex-shrink-0 relative active:scale-95
        snap-start will-change-transform overflow-hidden
      `}
    >
      {/* 💎 Subtle Glow on Hover only */}
      <div className="absolute inset-0 bg-lavender/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className={`relative aspect-square mb-4 overflow-hidden shadow-2xl ${isArtist ? 'rounded-full' : 'rounded-[20px]'} bg-white/5`}>
        {isEnriching ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
          </div>
        ) : displayImage ? (
          <img 
            src={displayImage} 
            alt={song.title} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 will-change-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiMusic className="text-2xl text-white/10" />
          </div>
        )}
        
        {/* Hover Overlays */}
        <div className="absolute inset-0 bg-lavender/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Play Button Overlay */}
        {!isArtist && (
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-lavender flex items-center justify-center shadow-[0_8px_25px_rgba(167,139,250,0.4)] transition-transform duration-500 ${
              isActive ? 'scale-100' : 'scale-75 group-hover:scale-100'
            }`}>
              <FiPlay className="text-black text-xl md:text-2xl fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Progress Bar (Recently Played) */}
        {showProgress && !isArtist && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40 overflow-hidden">
            <motion.div 
              className="h-full bg-lavender shadow-[0_0_8px_rgba(167,139,250,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* NEW Badge */}
        {isNew && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-lavender text-black text-[9px] font-black tracking-widest rounded-full shadow-[0_0_15px_rgba(167,139,250,0.6)] animate-pulse">
            NEW
          </div>
        )}

        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-md border border-lavender/20 flex items-center justify-center rounded-lg text-[12px] font-black text-white shadow-lg">
            {rank}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-0.5 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-[13px] md:text-[15px] font-black truncate leading-tight flex-1 ${isActive ? 'text-lavender' : 'text-white'}`}>
            {song.title || song.name || 'Unknown Title'}
          </h3>
          {!isArtist && (
            <button 
              onClick={handlePlus}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-lavender/20 text-white/30 hover:text-lavender transition-all active:scale-90 opacity-0 group-hover:opacity-100"
            >
              <FiPlus className="text-sm" />
            </button>
          )}
        </div>
        <p className={`text-[11px] md:text-[12px] text-white/40 font-bold truncate leading-tight tracking-wide ${isArtist ? 'text-center uppercase tracking-[0.1em] text-lavender/60' : ''}`}>
          {song.artist || song.channelTitle || (isArtist ? 'Artist' : 'Unknown Artist')}
        </p>
        {song.albumName && !isArtist && (
          <p className="text-[9px] text-lavender/30 font-bold truncate uppercase tracking-tighter">
            {song.albumName}
          </p>
        )}
      </div>

      {/* Active Glow */}
      {isActive && (
        <div className="absolute -inset-[1px] rounded-[32px] border border-lavender/60 shadow-[0_0_30px_rgba(167,139,250,0.25)] pointer-events-none z-0" />
      )}
    </motion.div>
  )
}
