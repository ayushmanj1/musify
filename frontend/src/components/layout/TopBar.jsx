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
  const { playSong, addToPlaylist, setIsSearchOpen } = usePlayer()

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#121212]/80 backdrop-blur-md border-b border-white/5">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-white/60 hover:text-white transition-all hover:bg-black/60"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button 
          onClick={() => navigate(1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-white/60 hover:text-white transition-all hover:bg-black/60"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Center: Search Button (Premium Redesign) */}
      <div className="flex-1 flex justify-center px-4">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="group relative flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-8 py-3.5 rounded-full w-full max-w-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        >
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-full blur-xl transition-opacity duration-700" />
          
          <FiSearch className="text-white/20 group-hover:text-[#1DB954] group-hover:scale-110 transition-all duration-500 text-xl relative z-10" />
          <span className="text-white/20 group-hover:text-white/40 font-bold text-[15px] tracking-tight transition-colors relative z-10">What do you want to play?</span>
          
          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 relative z-10">
            <span className="text-[10px] font-black text-white/20 border border-white/10 px-2 py-0.5 rounded-md">SEARCH</span>
          </div>
        </button>
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
