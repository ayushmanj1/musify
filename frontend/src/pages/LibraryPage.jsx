import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiClock, FiPlus, FiMusic, FiChevronRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongRow from '../components/ui/SongRow.jsx'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

export default function LibraryPage() {
  return (
    <>
      <SignedIn>
        <LibraryContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function LibraryContent() {
  const { savedSongs, recentlyPlayed, playlists, createPlaylist } = usePlayer()
  const [tab, setTab] = useState('saved')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  const handleCreate = () => {
    if (newName.trim()) {
      const pl = createPlaylist(newName.trim())
      setNewName('')
      setShowCreate(false)
      navigate(`/playlist/${pl.id}`)
    }
  }

  const tabs = [
    { id: 'saved', label: 'Favorites', icon: FiHeart, count: savedSongs.length },
    { id: 'playlists', label: 'Playlists', icon: FiMusic, count: playlists.length },
    { id: 'recent', label: 'History', icon: FiClock, count: recentlyPlayed.length },
  ]

  return (
    <div className="pt-6 px-4 md:px-10 pb-32 max-w-[1400px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8">Your Library</h1>
        
        {/* Modern Tab System */}
        <div className="flex gap-4 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit">
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
        {tab === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {savedSongs.length > 0 ? (
              <div className="flex flex-col">
                <div className="grid grid-cols-[50px_1fr_40px] px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 mb-4">
                  <span>#</span>
                  <span>Title / Artist</span>
                  <span className="text-center">Action</span>
                </div>
                {savedSongs.map((song, i) => (
                  <SongRow key={song.videoId} song={song} songs={savedSongs} index={i} showIndex />
                ))}
              </div>
            ) : (
              <EmptyState icon="❤️" title="No favorites yet" subtitle="Songs you like will appear here for quick access." />
            )}
          </motion.div>
        )}
        
        {tab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {recentlyPlayed.length > 0 ? (
              <div className="flex flex-col">
                <div className="grid grid-cols-[50px_1fr_40px] px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 mb-4">
                  <span>#</span>
                  <span>Title / Artist</span>
                  <span className="text-center">Action</span>
                </div>
                {recentlyPlayed.map((song, i) => (
                  <SongRow key={song.videoId} song={song} songs={recentlyPlayed} index={i} showIndex />
                ))}
              </div>
            ) : (
              <EmptyState icon="⏱️" title="No history" subtitle="Listen to some tracks and we'll track them here." />
            )}
          </motion.div>
        )}
        
        {tab === 'playlists' && (
          <motion.div key="playlists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Create Playlist Action Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => setShowCreate(true)}
                className="aspect-video sm:aspect-square rounded-[32px] p-8 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-white/10 hover:border-lavender/30 hover:bg-lavender/[0.02] transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-lavender group-hover:scale-110 transition-all mb-4">
                  <FiPlus size={32} />
                </div>
                <p className="font-bold text-white/60 group-hover:text-white">Create New Playlist</p>
              </motion.div>

              {playlists.map((pl, i) => (
                <motion.div 
                  key={pl.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/playlist/${pl.id}`)} 
                  className="aspect-video sm:aspect-square rounded-[32px] overflow-hidden cursor-pointer relative group glass-card"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  
                  {pl.songs.length > 0 ? (
                    <div className="grid grid-cols-2 w-full h-full group-hover:scale-110 transition-transform duration-700">
                      {pl.songs.slice(0, 4).map((s, idx) => (
                        <img key={idx} src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                      ))}
                      {pl.songs.length < 4 && Array.from({ length: 4 - pl.songs.length }).map((_, i) => (
                        <div key={i} className="bg-white/5" />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                      <FiMusic size={64} className="text-white/5" />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <h3 className="text-2xl font-black text-white tracking-tight mb-1 truncate">{pl.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white/40 uppercase tracking-widest">{pl.songs.length} Tracks</p>
                      <FiChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Create Playlist Modal (Premium Overlay) */}
            <AnimatePresence>
              {showCreate && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowCreate(false)}
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] p-8 glass-panel rounded-[40px] border border-white/10 shadow-2xl"
                  >
                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">New Collection</h2>
                    <input 
                      autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="My Vibe #1"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none mb-8 focus:border-lavender/50 transition-all"
                    />
                    <div className="flex gap-4">
                      <button onClick={() => setShowCreate(false)} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-all">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-[12px] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Create</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
