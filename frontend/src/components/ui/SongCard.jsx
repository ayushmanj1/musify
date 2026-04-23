import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, memo, useCallback } from 'react'
import { FiPlay, FiMusic } from 'react-icons/fi'
import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx'
import { enrichSongMetadata, generateGradientUrl } from '../../utils/api.js'

const SongCardProgress = memo(({ isCurrent, lastProgress }) => {
  const { currentTime, duration } = usePlayerTime()
  const progress = isCurrent && duration > 0 ? (currentTime / duration) * 100 : (lastProgress || 0)
  
  return (
    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/40 overflow-hidden">
      <motion.div 
        className="h-full bg-lavender shadow-[0_0_8px_rgba(167,139,250,0.6)]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
})

const SongCard = memo(({ 
  song: initialSong, 
  songs = [], 
  index = 0, 
  isArtist = false, 
  isChart = false,
  showProgress = false,
  isNew = false,
  rank = null
}) => {
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying } = usePlayer()
  const [song, setSong] = useState(initialSong)
  const [isEnriching, setIsEnriching] = useState(false)
  const [imgError, setImgError] = useState(false)
  
  useEffect(() => {
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

  const handleClick = () => {
    if (isChart) return // Charts navigation can be added later
    if (isArtist) {
      navigate(`/artist/${encodeURIComponent(song.title || song.name)}`)
      return
    }
    if (song.videoId) {
      playSong(song, songs.length > 0 ? songs : [song], index)
    }
  }



  const displayImage = imgError 
    ? generateGradientUrl(song.title || song.name || 'Music') 
    : (song.albumArt || song.thumbnail || generateGradientUrl(song.title || song.name || 'Music'))

  return (
    <div 
      onClick={handleClick}
      className={`
        w-[160px] md:w-full
        p-3 rounded-2xl 
        glass-card group cursor-pointer relative active:scale-[0.98] transition-all
        ${isActive ? 'border-lavender/30 ring-1 ring-lavender/20' : ''}
      `}
    >
      <div className="shimmer-sweep" />

      <div className={`relative aspect-square mb-3 overflow-hidden shadow-xl ${isArtist ? 'rounded-full' : 'rounded-xl'} bg-white/[0.03]`}>
        {isEnriching ? (
          <div className="absolute inset-0 flex items-center justify-center skeleton-shimmer" />
        ) : (
          <img 
            src={displayImage} 
            alt={song.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        
        {!isArtist && (
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-black shadow-2xl scale-90 group-hover:scale-100 transition-transform">
              <FiPlay className="text-xl fill-current ml-1" />
            </div>
          </div>
        )}

        {showProgress && !isArtist && (
          <SongCardProgress isCurrent={isCurrent} lastProgress={song.lastProgress} />
        )}

        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black tracking-widest rounded-md bg-lavender text-white">
            NEW
          </div>
        )}

        {rank && (
          <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black text-white bg-black/60 border border-white/10">
            {rank}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-[13px] md:text-[14px] font-bold truncate leading-tight flex-1 ${isActive ? 'text-lavender' : 'text-white/90'}`}>
            {song.title || song.name || 'Title'}
          </h3>
        </div>
        <p className={`text-[11px] text-white/30 font-bold truncate tracking-widest uppercase ${isArtist ? 'text-center' : ''}`}>
          {song.artist || song.channelTitle || (isArtist ? 'Artist' : 'Unknown')}
        </p>
      </div>
    </div>
  )
})

export default SongCard
