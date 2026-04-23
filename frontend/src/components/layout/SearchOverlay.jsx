import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiTrendingUp, FiClock, FiMusic } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { searchSongs } from '../../utils/api.js'

const BROWSE_CATEGORIES = [
  { name: 'Podcasts', color: '#E13300', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300' },
  { name: 'Audiobooks', color: '#27856A', img: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300' },
  { name: 'Made For You', color: '#1E3264', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
  { name: 'New releases', color: '#E8115B', img: 'https://images.unsplash.com/photo-1514525253344-981c1caa8cd3?w=300' },
  { name: 'Hip-Hop', color: '#BC5900', img: 'https://images.unsplash.com/photo-1571609832126-9932b17f5672?w=300' },
  { name: 'Pop', color: '#148A08', img: 'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?w=300' },
  { name: 'Country', color: '#D84000', img: 'https://images.unsplash.com/photo-1541913051-111444633e1b?w=300' },
  { name: 'Latin', color: '#E1118C', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300' },
  { name: 'Charts', color: '#8D67AB', img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300' },
  { name: 'Live Events', color: '#7358FF', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300' },
  { name: 'Rock', color: '#E91429', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300' },
  { name: 'Dance/Electronic', color: '#D84000', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300' },
  { name: 'Mood', color: '#E1118C', img: 'https://images.unsplash.com/photo-1499415479124-43c32433a620?w=300' },
  { name: 'Indie', color: '#E91429', img: 'https://images.unsplash.com/photo-1453090927415-5f45085b6a0d?w=300' },
  { name: 'Workout', color: '#777777', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300' },
  { name: 'K-Pop', color: '#148A08', img: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300' },
  { name: 'Chill', color: '#D84000', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300' },
  { name: 'Sleep', color: '#1E3264', img: 'https://images.unsplash.com/photo-1541480601022-2305c0f0248b?w=300' },
  { name: 'Party', color: '#AF2896', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300' },
  { name: 'At Home', color: '#477BA7', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300' },
  { name: 'Decades', color: '#BA5D07', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
  { name: 'Romance', color: '#8C1932', img: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=300' },
  { name: 'Jazz', color: '#777777', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300' },
  { name: 'Metal', color: '#E91429', img: 'https://images.unsplash.com/photo-1528645238318-22cc06010c28?w=300' },
  { name: 'Trending', color: '#E13300', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300' },
  { name: 'Wellness', color: '#A0C3D2', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300' },
  { name: 'Anime', color: '#E4115B', img: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=300' },
  { name: 'Gaming', color: '#8D67AB', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300' },
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
          setResults(data.slice(0, 12))
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

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)' }}
        >
          {/* Header & Search Bar */}
          <div className="p-4 md:px-12 md:py-10 flex flex-col items-center w-full" style={{ background: 'linear-gradient(to bottom, rgba(6,6,8,0.6), transparent)' }}>
            <div className="flex items-center gap-4 md:gap-6 w-full max-w-7xl relative">
              <div className="flex-1 relative group">
                <div className="absolute -inset-2 bg-lavender/10 rounded-full blur-3xl opacity-0 group-focus-within:opacity-100 transition-all duration-1000" />
                
                <motion.div 
                  layout
                  className="relative flex items-center rounded-full px-5 py-3 md:px-8 md:py-4 transition-all shadow-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <FiSearch className="text-white/25 text-xl md:text-2xl mr-3 md:mr-5 group-focus-within:text-lavender transition-all" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                    placeholder="Search music..."
                    className="w-full bg-transparent border-none outline-none text-lg md:text-2xl font-bold text-white placeholder:text-white/15 tracking-tight"
                  />
                  
                  {query && (
                    <button onClick={() => setQuery('')} className="text-white/15 hover:text-white transition-all ml-4">
                      <FiX size={20} />
                    </button>
                  )}
                </motion.div>
              </div>

              <button 
                onClick={handleClose}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center text-white/30 hover:text-lavender transition-all active:scale-90"
              >
                <FiX className="text-xl md:text-2xl" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-6 md:px-12 pb-32">
            <div className="max-w-7xl mx-auto w-full">
              {query.length < 2 ? (
                <div className="pt-12 pb-5">
                  <h3 className="section-heading text-2xl font-black text-white/80 tracking-tighter mb-8">Browse all</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                    {BROWSE_CATEGORIES.map((cat, i) => (
                      <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.015 }}
                        onClick={() => handleSearch(cat.name)}
                        className="aspect-square rounded-[16px] p-4 cursor-pointer relative overflow-hidden group transition-all duration-300 hover:scale-[1.04] active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${cat.color}cc, ${cat.color}66)`, boxShadow: `0 8px 30px ${cat.color}22` }}
                      >
                        <div className="shimmer-sweep" />
                        <span className="text-base md:text-lg font-black text-white relative z-10 leading-tight tracking-tight">
                          {cat.name}
                        </span>
                        <div className="absolute -bottom-2 -right-4 w-20 h-20 md:w-24 md:h-24 shadow-2xl rotate-[25deg] group-hover:rotate-[18deg] transition-transform duration-500 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                          <img src={cat.img} alt="" className="w-full h-full object-cover" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-12">
                  <div className="flex items-center justify-between pb-5">
                    <h3 className="section-heading text-sm font-black text-white/30 uppercase tracking-[4px]">Top Matches</h3>
                  </div>
                  
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-24 w-full skeleton-shimmer rounded-[24px]" />
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.map((song, i) => (
                        <motion.div
                          key={song.videoId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => { playSong(song); handleClose(); }}
                          className="flex items-center gap-5 p-4 rounded-[24px] glass-card cursor-pointer group"
                        >
                          <div className="shimmer-sweep" />
                          <div className="relative w-16 h-16 rounded-[14px] overflow-hidden shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[16px] font-bold text-white/90 truncate leading-tight group-hover:text-lavender transition-colors">{song.title}</p>
                            <p className="text-[13px] text-white/30 font-medium truncate mt-1">{song.artist}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-white/25 text-xl font-bold uppercase tracking-[5px]">No results found</p>
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
