import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiBell, FiUser, FiSettings, FiGrid } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function TopBar() {
  const navigate = useNavigate()
  const { setIsSearchOpen } = usePlayer()

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 md:px-10 md:py-6 bg-black/40 backdrop-blur-2xl border-b border-white/5">
      {/* Left: Brand */}
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.3)]">
          <FiGrid className="text-black text-xl" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white hidden md:block">MUSIFY</h1>
      </div>

      {/* Center: Spacer */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-5">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden text-white/40 hover:text-[#A78BFA] transition-all p-2 rounded-full hover:bg-white/5"
        >
          <FiSearch className="text-xl" />
        </button>
        <button className="text-white/40 hover:text-[#A78BFA] transition-all relative p-2 rounded-full hover:bg-white/5">
          <FiBell className="text-xl" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#A78BFA] rounded-full shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
        </button>
        <button className="text-white/40 hover:text-[#A78BFA] transition-all p-2 rounded-full hover:bg-white/5 hidden md:block">
          <FiSettings className="text-xl" />
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-white/10 p-0.5 cursor-pointer hover:border-[#A78BFA]/50 transition-all active:scale-90">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
            <FiUser className="text-white/40 text-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
