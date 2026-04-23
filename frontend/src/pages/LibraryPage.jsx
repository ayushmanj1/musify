import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiClock, FiPlus, FiMusic, FiChevronRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongCard from '../components/ui/SongCard.jsx'
import { haptics } from '../utils/haptics.js'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

export default function LibraryPage() {
  return (
    <LibraryContent />
  )
}

function LibraryContent() {
  const { savedSongs, recentlyPlayed } = usePlayer()
  const [tab, setTab] = useState('saved')




  const tabs = [
    { id: 'saved', label: 'Favorites', count: savedSongs.length },
    { id: 'recent', label: 'History', count: recentlyPlayed.length },
  ]

  return (
    <div className="pt-6 px-4 md:px-10 pb-32 max-w-[1400px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 hidden md:block">Your Library</h1>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-8 md:hidden">Liked Music</h1>
        
        {/* Modern Tab System - Hidden on Mobile to focus only on Liked Music */}
        <div className="hidden md:flex gap-4 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit">
          {tabs.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                tab === t.id ? 'text-black' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {t.label}
                {t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab === t.id ? 'bg-black/10' : 'bg-white/5'}`}>{t.count}</span>}
              </span>
              {tab === t.id && (
                <motion.div 
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* On mobile, we only show 'saved' tab content. On desktop, we show based on selection. */}
        {tab === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {savedSongs.length > 0 ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence>
                  {savedSongs.map((song, i) => (
                    <motion.div 
                      key={song.videoId} 
                      layout 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: i * 0.02 }}
                      whileTap={{ scale: 0.95, filter: 'brightness(1.2)' }}
                      onTapStart={() => haptics.light()}
                    >
                      <SongCard song={song} songs={savedSongs} index={i} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <EmptyState icon="❤️" title="No favorites yet" subtitle="Songs you like will appear here for quick access." />
            )}
          </motion.div>
        )}
        
        {/* Hide History and Playlists on mobile to fulfill "only show liked music" request */}
        {tab === 'recent' && (
          <motion.div key="recent" className="hidden md:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {recentlyPlayed.length > 0 ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence>
                  {recentlyPlayed.map((song, i) => (
                    <motion.div 
                      key={song.videoId} 
                      layout 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: i * 0.02 }}
                      whileTap={{ scale: 0.95, filter: 'brightness(1.2)' }}
                      onTapStart={() => haptics.light()}
                    >
                      <SongCard song={song} songs={recentlyPlayed} index={i} showProgress />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <EmptyState icon="⏱️" title="No history" subtitle="Listen to some tracks and we'll track them here." />
            )}
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-24 h-24 rounded-full bg-white/[0.03] flex items-center justify-center text-4xl mb-6 shadow-2xl border border-white/[0.05]">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-white/30 font-bold max-w-xs mx-auto leading-relaxed uppercase text-[10px] tracking-[0.2em]">{subtitle}</p>
    </div>
  )
}
