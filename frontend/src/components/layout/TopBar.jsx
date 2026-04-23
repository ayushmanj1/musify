import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiBell, FiUser, FiSettings, FiGrid, FiSun, FiMoon, FiPlay } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { getTrending } from '../../utils/api.js'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react'

export default function TopBar() {
  const navigate = useNavigate()
  const { setIsSearchOpen, playSong } = usePlayer()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [trending, setTrending] = useState([])
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  
  const notifRef = useRef(null)
  const settingsRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    async function loadTrending() {
      const data = await getTrending()
      setTrending(data.slice(0, 5))
    }
    loadTrending()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotificationsOpen(false)
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Consistent Button Classes
  const btnClass = "w-11 h-11 md:w-12 md:h-12 rounded-full glass-btn flex items-center justify-center relative transition-all active:scale-90"

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 md:px-10 md:py-4 transition-all duration-300" style={{ background: 'rgba(167, 139, 250, 0.08)', backdropFilter: 'blur(30px) saturate(180%)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)' }}>
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-6 md:gap-10">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-lavender to-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.3)] group-hover:scale-105 transition-all">
            <FiGrid className="text-white text-lg md:text-xl" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-lavender hidden md:block group-hover:text-lavender-light transition-colors">
            MUSIFY
          </h1>
        </div>

        {/* Browser-style Navigation Arrows */}
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-full glass-btn flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 border border-white/5"
            title="Go Back"
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button 
            onClick={() => navigate(1)} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-full glass-btn flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 border border-white/5"
            title="Go Forward"
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        <button onClick={() => setIsSearchOpen(true)} className={`${btnClass} md:hidden`}>
          <FiSearch className="text-[var(--text-main)] opacity-40 text-lg" />
        </button>

        {/* Notifications (Bell) */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={btnClass}>
            <FiBell className="text-[var(--text-main)] opacity-40 text-lg" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-lavender rounded-full shadow-glow" />
          </button>
          
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-72 md:w-80 p-4 glass-panel rounded-[24px] shadow-2xl border border-[var(--glass-border)]"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] opacity-40">Trending Today</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {trending.map((song) => (
                    <div 
                      key={song.videoId} 
                      onClick={() => { playSong(song, trending); setIsNotificationsOpen(false); }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                    >
                      <img src={song.thumbnail} className="w-10 h-10 rounded-lg object-cover shadow-md" alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-[var(--text-main)]">{song.title}</p>
                        <p className="text-[10px] opacity-30 truncate uppercase font-bold tracking-wider">{song.artist}</p>
                      </div>
                      <FiPlay size={12} className="text-lavender opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SignedIn>
          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={btnClass}>
              <FiSettings className="text-[var(--text-main)] opacity-40 text-lg" />
            </button>
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-64 p-2 glass-panel rounded-[24px] shadow-2xl border border-[var(--glass-border)]"
                >
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold text-[var(--text-main)]"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <FiMoon /> : <FiSun />}
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                    <div className="w-10 h-5 bg-white/10 rounded-full relative">
                      <motion.div 
                        animate={{ x: theme === 'dark' ? 2 : 22 }}
                        className="absolute top-1 w-3 h-3 bg-lavender rounded-full" 
                      />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center">
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-11 h-11 md:w-12 md:h-12 rounded-full border border-[var(--glass-border)] p-0.5 glass-btn',
                }
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <div className={`${btnClass} cursor-pointer group`}>
              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden group-hover:bg-lavender/10 transition-colors">
                <FiUser className="text-[var(--text-main)] opacity-30 text-lg group-hover:text-lavender transition-colors" />
              </div>
            </div>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  )
}
