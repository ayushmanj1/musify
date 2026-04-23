import { useState, useEffect } from 'react'
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#1DB954] rounded-full animate-spin mb-4" />
        <p className="text-white/40 font-medium">Fetching top tracks...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
        <p className="text-4xl mb-6">📉</p>
        <h2 className="text-2xl font-bold text-white mb-2">Chart Not Found</h2>
        <p className="text-white/50 mb-8 max-w-md">The requested chart is currently unavailable or doesn't exist.</p>
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/20 via-black/80 to-[#121212]" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 h-48 bg-gradient-to-br from-[#1DB954] to-[#121212] rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/10"
          >
            {songs[0] ? (
              <img src={songs[0].thumbnail} alt="" className="w-full h-full object-cover opacity-50 blur-sm scale-110" />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center flex-col p-4 text-center">
              <span className="text-6xl mb-2">📊</span>
              <p className="font-black text-white text-[10px] uppercase tracking-widest leading-tight">{chart.name.split(' ').join('\n')}</p>
            </div>
          </motion.div>
          
          <div className="flex-1 pb-4">
            <p className="text-white text-xs font-black uppercase tracking-[4px] mb-2">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
              {chart.name}
            </h1>
            <p className="text-white/60 font-medium max-w-2xl">
              {chart.description}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8 px-2">
        <button 
          onClick={handlePlayAll}
          className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95 group"
        >
          <FiPlay className="text-black text-2xl fill-current ml-1" />
        </button>
        <button className="text-white/40 hover:text-white transition-colors">
          <FiMoreHorizontal size={28} />
        </button>
      </div>

      {/* List Header */}
      <div className="px-4 py-2 border-b border-white/5 mb-4 grid grid-cols-[40px_1fr_1fr_40px] gap-4 text-white/30 text-[11px] font-black uppercase tracking-widest">
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
              transition={{ delay: index * 0.03 }}
              onClick={() => playSong(song, songs, index)}
              className={`group grid grid-cols-[40px_1fr_1fr_40px] gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer ${isCurrent ? 'bg-white/10' : ''}`}
            >
              <div className={`text-center font-bold ${index < 3 ? 'text-[#1DB954] text-lg' : 'text-white/20 group-hover:text-white/40'}`}>
                {isCurrent ? (
                   <div className="flex justify-center">
                     <div className="w-3 h-3 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : index + 1}
              </div>
              
              <div className="flex items-center gap-4 min-w-0">
                <img src={song.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shadow-lg" />
                <div className="min-w-0">
                  <h4 className={`font-bold truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                    {song.title}
                  </h4>
                  <p className="text-xs text-white/40 font-medium md:hidden">
                    {song.artist}
                  </p>
                </div>
              </div>
              
              <div className="hidden md:block text-white/40 text-sm font-medium truncate">
                {song.artist}
              </div>
              
              <div className="flex justify-center text-white/40 text-xs font-medium">
                {Math.floor(Math.random() * 3) + 2}:{Math.floor(Math.random() * 50).toString().padStart(2, '0')}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
