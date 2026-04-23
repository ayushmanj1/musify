import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiTrendingUp, FiClock, FiMusic } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { searchSongs } from '../../utils/api.js'

const SUGGESTED_CATEGORIES = [
  { name: 'Hindi Hits', color: 'bg-orange-500' },
  { name: 'Punjabi Pop', color: 'bg-blue-500' },
  { name: 'English Top 40', color: 'bg-purple-500' },
  { name: 'Haryanvi Vibes', color: 'bg-green-500' },
  { name: 'Lofi & Chill', color: 'bg-indigo-500' },
  { name: 'Romantic Melodies', color: 'bg-red-500' },
]

export default function SearchOverlay() {
  const navigate = useNavigate()
  const { isSearchOpen, setIsSearchOpen, playSong } = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true)
        try {
          const data = await searchSongs(query)
          setResults(data.slice(0, 8))
        } catch (err) {
          console.error(err)
        }
        setLoading(false)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleClose = () => {
    setIsSearchOpen(false)
    setQuery('')
    setResults([])
  }

  const handleSearch = (q) => {
    if (!q.trim()) return
    navigate('/search', { state: { query: q } })
    handleClose()
  }

  const handleSelectSong = (song) => {
    playSong(song)
    handleClose()
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col"
        >
          {/* Header & Search Bar */}
          <div className="p-8 md:p-12 flex flex-col items-center max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-6 w-full relative">
              <div className="flex-1 relative group">
                {/* Glow Background */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#1DB954]/40 to-blue-500/40 rounded-full blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                
                <motion.div 
                  layout
                  className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full px-8 py-5 focus-within:bg-white/[0.08] focus-within:border-white/20 transition-all shadow-[0_30px_100px_rgba(0,0,0,0.5)] group-focus-within:scale-[1.02]"
                >
                  <FiSearch className="text-white/20 text-2xl mr-5 group-focus-within:text-[#1DB954] group-focus-within:scale-110 transition-all duration-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                    placeholder="What do you want to listen to?"
                    className="w-full bg-transparent border-none outline-none text-xl md:text-3xl font-black text-white placeholder:text-white/10 tracking-tight"
                  />
                  
                  <AnimatePresence>
                    {query && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={() => setQuery('')} 
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all ml-4"
                      >
                        <FiX size={20} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              <button 
                onClick={handleClose}
                className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all active:scale-90 flex-shrink-0"
                title="Close (Esc)"
              >
                <FiX size={32} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-6 md:px-8 pb-32">
            <div className="max-w-5xl mx-auto w-full">
              {query.length < 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 animate-fade-in">
                  {/* Recent Searches / Suggested Categories */}
                  <div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                      <FiTrendingUp className="text-[#1DB954]" />
                      Browse Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {SUGGESTED_CATEGORIES.map((cat, i) => (
                        <motion.div
                          key={cat.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSearch(cat.name)}
                          className={`${cat.color} aspect-[16/9] rounded-2xl p-4 cursor-pointer hover:scale-[1.05] transition-all relative overflow-hidden group shadow-lg`}
                        >
                          <span className="text-lg font-black text-white relative z-10 leading-tight">{cat.name}</span>
                          <FiMusic className="absolute -bottom-2 -right-2 text-white/20 text-6xl rotate-12 group-hover:scale-110 transition-transform" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Top Artists */}
                  <div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                      <FiClock className="text-[#1DB954]" />
                      Recommended for You
                    </h3>
                    <div className="flex flex-col gap-2">
                      {['Karan Aujla', 'Arijit Singh', 'The Weeknd', 'Sidhu Moose Wala'].map((artist, i) => (
                        <motion.div
                          key={artist}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSearch(artist)}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#1DB954]/20 transition-colors">
                            <span className="text-white font-bold">{artist[0]}</span>
                          </div>
                          <span className="text-lg font-bold text-white/80 group-hover:text-white transition-colors">{artist}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[4px]">Results for "{query}"</h3>
                    <div className="h-px flex-1 bg-white/5 ml-6" />
                  </div>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[88px] w-full bg-white/[0.02] rounded-[24px] animate-pulse border border-white/5" />
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.map((song, i) => (
                        <motion.div
                          key={song.videoId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelectSong(song)}
                          className="flex items-center gap-5 p-4 rounded-[28px] bg-white/[0.02] border border-white/5 hover:border-[#1DB954]/50 hover:bg-white/[0.08] cursor-pointer transition-all duration-500 group relative overflow-hidden"
                        >
                          {/* Inner Glow on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                          
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1 relative">
                            <p className="text-[17px] font-bold text-white truncate leading-tight mb-1 group-hover:text-[#1DB954] transition-colors">{song.title}</p>
                            <p className="text-[13px] text-white/40 font-medium truncate tracking-wide">{song.artist}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            <FiMusic className="text-[#1DB954] text-sm" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-6xl mb-6">🔍</p>
                      <p className="text-white/40 text-lg font-medium">No results found for your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
