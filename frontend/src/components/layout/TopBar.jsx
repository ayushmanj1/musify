import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiHome, FiBell, FiUsers, FiPlusCircle } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

const MOCK_SUGGESTIONS = [
  { videoId: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', type: 'Song', thumbnail: 'https://picsum.photos/40/40?random=10' },
  { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', type: 'Song', thumbnail: 'https://picsum.photos/40/40?random=11' },
  { videoId: 'fLexgOxsZu0', title: 'Shape of You', artist: 'Ed Sheeran', type: 'Song', thumbnail: 'https://picsum.photos/40/40?random=12' },
  { videoId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson', type: 'Song', thumbnail: 'https://picsum.photos/40/40?random=13' },
  { videoId: 'JGwWNGJdvx8', title: 'Shape of You (Radio Edit)', artist: 'Ed Sheeran', type: 'Radio', thumbnail: 'https://picsum.photos/40/40?random=14' },
]

export default function TopBar() {
  const navigate = useNavigate()
  const { playSong, addToPlaylist } = usePlayer()
  
  const [query, setQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const searchRef = useRef(null)

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = MOCK_SUGGESTIONS.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) || 
        s.artist.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSearchSubmit = (item) => {
    if (item) {
      playSong(item)
      setQuery('')
      setIsSearchFocused(false)
    } else if (query.trim()) {
      navigate('/search', { state: { query } })
      setIsSearchFocused(false)
    }
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-md">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white/60 hover:text-white mr-2"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button 
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white/60 hover:text-white mr-2"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex items-center gap-2 max-w-2xl flex-1 justify-center relative" ref={searchRef}>
        <motion.div 
          layout
          className="relative w-full max-w-[480px]"
        >
          <div className={`relative flex items-center bg-[#242424] hover:bg-[#2a2a2a] transition-all rounded-full overflow-hidden search-glow ${isSearchFocused ? 'h-[52px]' : 'h-[48px]'}`}>
            <FiSearch className="text-white/40 text-xl ml-4 mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(suggestions[0] || null)}
              placeholder="What do you want to play?"
              className="w-full bg-transparent border-none outline-none text-white text-[15px] font-medium placeholder:text-white/35 h-full pr-12"
            />
            <button className="absolute right-4 text-white/40 hover:text-white">
              <span className="text-lg">✦</span>
            </button>
          </div>

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {isSearchFocused && query.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-xl p-2 z-50 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/[0.06] bg-[#1a1a1a]"
              >
                {suggestions.length > 0 ? (
                  suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="w-full text-left flex items-center justify-between gap-4 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                      onClick={() => handleSearchSubmit(s)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={s.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white truncate">{s.title}</p>
                          <p className="text-[12px] text-white/50 truncate">{s.type} • {s.artist}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToPlaylist('temp', s) }}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <FiPlusCircle className="text-xl" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-white/40 text-sm">No results found for "{query}"</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="text-white/60 hover:text-white transition-colors relative flex items-center justify-center w-8 h-8 rounded-full bg-black/40">
          <FiBell className="text-[18px]" />
        </button>
        <button className="text-white/60 hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-black/40">
          <FiUsers className="text-[18px]" />
        </button>
        <button className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform border-4 border-surface">
          H
        </button>
      </div>
    </div>
  )
}
