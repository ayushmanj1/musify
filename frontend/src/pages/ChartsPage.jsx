import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlay, FiClock, FiMoreHorizontal, FiArrowLeft, FiPlus } from 'react-icons/fi'
import { getChart } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'

export default function ChartsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying } = usePlayer()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchChart() {
      setLoading(true)
      try {
        const result = await getChart(id)
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load chart')
      }
      setLoading(false)
    }
    fetchChart()
  }, [id])

  // Pre-generate stable durations
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
        <p className="text-white/30 font-medium">Fetching top tracks...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
        <p className="text-4xl mb-6">📉</p>
        <h2 className="text-2xl font-bold text-white mb-2">Chart Not Found</h2>
        <p className="text-white/40 mb-8 max-w-md">The requested chart is currently unavailable.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          Go Back
        </button>
      </div>
    )
  }

  const { chart, songs } = data

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0)
    }
  }

  return (
    <div className="relative">
      {/* Header Banner */}
      <div className="relative h-[300px] -mt-16 -mx-6 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-lavender/15 via-[var(--luxury-black)]/80 to-[var(--luxury-black)]" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 h-48 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(6,6,8,0.8))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          >
            {songs[0] ? (
              <img src={songs[0].thumbnail} alt="" className="w-full h-full object-cover opacity-40 blur-sm scale-110" />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center flex-col p-4 text-center">
              <span className="text-6xl mb-2">📊</span>
              <p className="font-black text-white/80 text-[10px] uppercase tracking-widest leading-tight">{chart.name.split(' ').join('\n')}</p>
            </div>
          </motion.div>
          
          <div className="flex-1 pb-4">
            <p className="text-white/40 text-xs font-bold uppercase tracking-[4px] mb-2">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
              {chart.name}
            </h1>
            <p className="text-white/35 font-medium max-w-2xl">
              {chart.description}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8 px-2">
        <button 
          onClick={handlePlayAll}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', boxShadow: '0 8px 30px rgba(167,139,250,0.3)' }}
        >
          <FiPlay className="text-white text-2xl fill-current ml-1" />
        </button>
        <button className="text-white/30 hover:text-white transition-colors">
          <FiMoreHorizontal size={28} />
        </button>
      </div>

      {/* List Header */}
      <div className="px-4 py-2 mb-4 grid grid-cols-[40px_1fr_1fr_40px] gap-4 text-white/20 text-[11px] font-bold uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-center">#</div>
        <div>Title</div>
        <div className="hidden md:block">Artist</div>
        <div className="flex justify-center"><FiClock size={14} /></div>
      </div>

      {/* Song List */}
      <div className="flex flex-col gap-1 pb-32">
        {songs.map((song, index) => {
          const isCurrent = currentSong?.videoId === song.videoId
          const isActive = isCurrent && isPlaying

          return (
            <motion.div
              key={song.videoId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => playSong(song, songs, index)}
              className="group grid grid-cols-[40px_1fr_1fr_40px] gap-4 items-center p-3 rounded-[14px] cursor-pointer transition-all duration-300"
              style={isCurrent ? { background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)' } : { border: '1px solid transparent' }}
              onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = isCurrent ? 'rgba(167,139,250,0.06)' : 'transparent' }}
            >
              <div className={`text-center font-bold ${index < 3 ? 'text-lavender text-lg' : 'text-white/15 group-hover:text-white/30'}`}>
                {isCurrent ? (
                   <div className="flex justify-center">
                     <div className="w-3 h-3 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : index + 1}
              </div>
              
              <div className="flex items-center gap-4 min-w-0">
                <img src={song.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shadow-lg" />
                <div className="min-w-0">
                  <h4 className={`font-bold truncate ${isCurrent ? 'text-lavender' : 'text-white/90'}`}>
                    {song.title}
                  </h4>
                  <p className="text-xs text-white/30 font-medium md:hidden">
                    {song.artist}
                  </p>
                </div>
              </div>
              
              <div className="hidden md:block text-white/25 text-sm font-medium truncate">
                {song.artist}
              </div>
              
              <div className="flex justify-center text-white/20 text-xs font-medium">
                {durations[index] || '3:30'}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
