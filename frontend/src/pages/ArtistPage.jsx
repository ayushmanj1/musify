import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlay, FiArrowLeft, FiMoreHorizontal, FiClock, FiCheck } from 'react-icons/fi'
import { getArtistSongs } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'

export default function ArtistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying } = usePlayer()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchArtist() {
      setLoading(true)
      try {
        const result = await getArtistSongs(id)
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load artist details')
      }
      setLoading(false)
    }
    fetchArtist()
  }, [id])

  // Pre-generate stable durations for each song
  const durations = useMemo(() => {
    if (!data?.songs) return []
    return data.songs.map((_, i) => {
      const min = 2 + ((i * 7 + 3) % 4)
      const sec = ((i * 13 + 5) % 50)
      return `${min}:${sec.toString().padStart(2, '0')}`
    })
  }, [data?.songs])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-3 border-lavender/10 border-t-lavender rounded-full animate-spin mb-4" />
        <p className="text-white/30 font-medium animate-pulse">Loading artist profile...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
        <p className="text-4xl mb-6">🏜️</p>
        <h2 className="text-2xl font-bold text-white mb-2">Oops! Artist not found</h2>
        <p className="text-white/40 mb-8 max-w-md">We couldn't find the artist you're looking for.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          Go Back Home
        </button>
      </div>
    )
  }

  const { artist, songs } = data

  const handlePlayArtist = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0)
    }
  }

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[340px] -mt-16 -mx-6 mb-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-30"
          style={{ backgroundImage: `url(${artist.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--luxury-black)]/20 via-[var(--luxury-black)]/60 to-[var(--luxury-black)]" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.06)' }}
          >
            <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
          </motion.div>
          
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-[#3d91ff] flex items-center justify-center">
                <FiCheck className="text-white text-[10px] stroke-[4]" />
              </div>
              <span className="text-[12px] font-medium uppercase tracking-widest text-white/60">Verified Artist</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter">
              {artist.name}
            </h1>
            <p className="text-white/40 font-medium">
              {songs.length} monthly listeners • {songs.length} tracks available
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8 px-2">
        <button 
          onClick={handlePlayArtist}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', boxShadow: '0 8px 30px rgba(167,139,250,0.3)' }}
        >
          <FiPlay className="text-white text-2xl fill-current ml-1" />
        </button>
        <button className="px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider glass-btn text-white/80">
          Follow
        </button>
        <button className="text-white/30 hover:text-white transition-colors">
          <FiMoreHorizontal size={28} />
        </button>
      </div>

      {/* Song List */}
      <div className="px-2 pt-12 pb-5">
        <h2 className="section-heading text-2xl font-bold text-white/80">Popular</h2>
        
        <div className="flex flex-col gap-1">
          {songs.map((song, index) => {
            const isCurrent = currentSong?.videoId === song.videoId
            const isActive = isCurrent && isPlaying

            return (
              <motion.div
                key={song.videoId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => playSong(song, songs, index)}
                className={`group flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-all duration-300 ${isCurrent ? '' : ''}`}
                style={isCurrent ? { background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)' } : { border: '1px solid transparent' }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="w-8 text-right font-medium text-white/25 group-hover:text-white/50">
                  {isCurrent ? (
                    <div className="flex justify-end pr-1">
                      <div className="w-3 h-3 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : index + 1}
                </div>
                
                <img src={song.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold truncate ${isCurrent ? 'text-lavender' : 'text-white/90'}`}>
                    {song.title}
                  </h4>
                  <p className="text-sm text-white/30 font-medium">
                    {song.artist}
                  </p>
                </div>
                
                <div className="hidden md:block text-white/20 text-sm font-medium mr-8">
                  {durations[index] || '3:30'}
                </div>
                
                <button className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-opacity">
                  <FiMoreHorizontal />
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
