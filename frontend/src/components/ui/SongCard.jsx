import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiPlay, FiPlus, FiMusic } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function SongCard({ song, songs = [], index = 0, isRadio = false, isChart = false }) {
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying, setIsSidebarExpanded, setSongToAdd } = usePlayer()
  
  const isArtist = isRadio || song.isArtist
  const isCurrent = currentSong?.videoId === song.videoId
  const isActive = isCurrent && isPlaying

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
      playSong(song, songs, index)
    }
  }

  const handlePlus = (e) => {
    e.stopPropagation()
    setSongToAdd(song)
    setIsSidebarExpanded(true)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={handleClick}
      className={`w-[170px] p-3 rounded-[20px] glass-card cursor-pointer group flex-shrink-0 relative active:scale-95`}
    >
      <div className="relative aspect-square mb-4 overflow-hidden rounded-[14px] shadow-2xl">
        {song.thumbnail ? (
          <img 
            src={song.thumbnail} 
            alt={song.title} 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isRadio ? 'rounded-full scale-90 group-hover:scale-100' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <FiMusic className="text-3xl text-white/10" />
          </div>
        )}
        
        {/* Hover Overlays */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button */}
        <div className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1DB954] flex items-center justify-center shadow-[0_8px_20px_rgba(29,185,84,0.4)] transition-all duration-500 scale-90 group-hover:scale-100 ${
          isActive ? 'opacity-100' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
        }`}>
          <FiPlay className="text-black text-lg fill-current ml-1" />
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className={`text-[13px] font-bold truncate leading-tight flex-1 ${isActive ? 'text-[#1DB954]' : 'text-white'}`}>
            {song.title || 'Unknown Title'}
          </h3>
          <button 
            onClick={handlePlus}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/40 hover:text-white transition-all active:scale-90"
          >
            <FiPlus className="text-sm" />
          </button>
        </div>
        <p className="text-[11px] text-white/40 font-medium truncate leading-tight">
          {song.artist || song.channelTitle || 'Unknown Artist'}
        </p>
      </div>
    </motion.div>
  )
}
