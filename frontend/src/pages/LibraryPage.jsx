import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiClock, FiPlus, FiMusic } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongRow from '../components/ui/SongRow.jsx'

function EmptyState({ icon, title, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <p className="text-6xl mb-4">{icon}</p>
      <p className="text-white font-bold text-xl">{title}</p>
      <p className="text-text-secondary text-sm mt-2">{subtitle}</p>
    </motion.div>
  )
}

export default function LibraryPage() {
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
    { id: 'saved', label: 'Liked Songs', icon: FiHeart, count: savedSongs.length },
    { id: 'recent', label: 'Recent', icon: FiClock, count: recentlyPlayed.length },
    { id: 'playlists', label: 'Playlists', icon: FiMusic, count: playlists.length },
  ]

  return (
    <div className="pt-2">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-white mb-6">Your Library</motion.h1>

      {/* Tabs / Filters (Spotify style pills) */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((t) => (
          <motion.button key={t.id} whileTap={{ scale: 0.95 }} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-black'
                : 'bg-surface-hover text-white hover:bg-surface-active'
            }`}>
            {t.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {savedSongs.length > 0 ? (
              <div className="flex flex-col gap-1">
                {savedSongs.map((song, i) => <SongRow key={song.videoId} song={song} songs={savedSongs} index={i} showIndex />)}
              </div>
            ) : <EmptyState icon="❤️" title="Songs you like will appear here" subtitle="Save songs by tapping the heart icon." />}
          </motion.div>
        )}
        
        {tab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {recentlyPlayed.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentlyPlayed.map((song, i) => <SongRow key={song.videoId} song={song} songs={recentlyPlayed} index={i} showIndex />)}
              </div>
            ) : <EmptyState icon="⏱️" title="No recent history" subtitle="Start playing songs to see them here." />}
          </motion.div>
        )}
        
        {tab === 'playlists' && (
          <motion.div key="playlists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.button whileTap={{ scale: 0.99 }} onClick={() => setShowCreate(!showCreate)}
              className="w-full bg-surface-card hover:bg-surface-hover rounded-md p-3 mb-4 flex items-center gap-4 transition-all group">
              <div className="w-14 h-14 rounded-md bg-surface-hover group-hover:bg-surface-active flex items-center justify-center transition-colors">
                <FiPlus className="text-2xl text-text-secondary group-hover:text-white" />
              </div>
              <span className="font-bold text-white">Create playlist</span>
            </motion.button>
            
            {showCreate && (
              <div className="bg-surface-card rounded-md p-4 mb-4 flex gap-3">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()} placeholder="My Playlist #1" autoFocus
                  className="flex-1 bg-surface-hover border border-white/10 rounded-md px-4 py-2 text-white placeholder:text-text-muted focus:outline-none focus:border-white/30" />
                <button onClick={handleCreate} className="px-6 py-2 bg-white hover:scale-105 text-black rounded-full font-bold transition-transform">Create</button>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {playlists.map((pl, i) => (
                <motion.div key={pl.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.03, ease: "easeOut" }}
                  onClick={() => navigate(`/playlist/${pl.id}`)} 
                  className="group bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] rounded-[24px] p-3 cursor-pointer transition-all duration-500 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                  <div className="w-full aspect-square rounded-[18px] bg-white/[0.05] flex items-center justify-center mb-4 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    {pl.songs.length > 0 ? (
                      <div className="grid grid-cols-2 w-full h-full group-hover:scale-105 transition-transform duration-700">
                        {pl.songs.slice(0, 4).map((s, idx) => <img key={idx} src={s.thumbnail} alt="" className="w-full h-full object-cover" />)}
                        {pl.songs.length < 4 && Array.from({ length: 4 - Math.min(pl.songs.length, 4) }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-full h-full bg-white/[0.02]" />
                        ))}
                      </div>
                    ) : <FiMusic className="text-4xl text-white/20" />}
                  </div>
                  <h3 className="text-[15px] font-bold tracking-tight text-white/90 group-hover:text-white truncate mb-1">{pl.name}</h3>
                  <p className="text-[13px] text-white/50 font-medium mt-1">Playlist • {pl.songs.length} songs</p>
                </motion.div>
              ))}
            </div>
            {playlists.length === 0 && !showCreate && <EmptyState icon="🎵" title="Create your first playlist" subtitle="It's easy, we'll help you." />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
