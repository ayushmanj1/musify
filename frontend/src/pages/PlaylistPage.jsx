import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlay, FiTrash2, FiMoreHorizontal, FiList, FiClock, FiMusic } from 'react-icons/fi'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongRow from '../components/ui/SongRow.jsx'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

export default function PlaylistPage() {
  return (
    <>
      <SignedIn>
        <PlaylistContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function PlaylistContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playlists, playSong, removeFromPlaylist, deletePlaylist } = usePlayer()

  const playlist = playlists.find(pl => pl.id === id)
  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-6">🫠</div>
        <h2 className="text-2xl font-black text-white mb-2">Collection Not Found</h2>
        <button onClick={() => navigate('/library')} className="text-lavender font-bold hover:underline">Back to Library</button>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs, 0)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Delete this collection?')) {
      deletePlaylist(id)
      navigate('/library')
    }
  }

  return (
    <div className="relative pb-32">
      {/* Dynamic Header */}
      <div className="relative pt-12 pb-12 px-6 md:px-12 flex flex-col md:flex-row items-end gap-10 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-lavender/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Playlist Artwork (Premium Stack) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-56 h-56 md:w-72 md:h-72 rounded-[40px] overflow-hidden flex-shrink-0 shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-10 border border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {playlist.songs.length > 0 ? (
            <div className="grid grid-cols-2 w-full h-full">
              {playlist.songs.slice(0, 4).map((s, idx) => <img key={idx} src={s.thumbnail} alt="" className="w-full h-full object-cover" />)}
              {playlist.songs.length < 4 && Array.from({ length: 4 - playlist.songs.length }).map((_, i) => (
                <div key={i} className="bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/5">
              <FiMusic size={80} />
            </div>
          )}
        </motion.div>
        
        <div className="flex-1 z-10">
          <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-4">Collection</p>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none">{playlist.name}</h1>
          
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handlePlayAll}
              disabled={playlist.songs.length === 0}
              className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-[12px] shadow-2xl flex items-center gap-3 disabled:opacity-30 transition-all"
            >
              <FiPlay className="fill-current" /> Play All
            </motion.button>
            
            <button 
              onClick={handleDelete}
              className="w-14 h-14 rounded-full glass-btn flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
            >
              <FiTrash2 size={24} />
            </button>
            
            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">{playlist.songs.length} Tracks • 2024</p>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="px-4 md:px-10 mt-12">
        {playlist.songs.length > 0 ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-[50px_1fr_80px_40px] px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white/10 border-b border-white/5 mb-6">
              <span>#</span>
              <span>Track Title</span>
              <span className="hidden md:block">Duration</span>
              <span className="text-center"><FiClock size={14} className="mx-auto" /></span>
            </div>
            
            <div className="flex flex-col gap-1">
              {playlist.songs.map((song, i) => (
                <SongRow 
                  key={song.videoId} 
                  song={song} 
                  songs={playlist.songs} 
                  index={i} 
                  showIndex
                  onRemove={(videoId) => removeFromPlaylist(id, videoId)} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
            <p className="text-white/40 font-black text-2xl tracking-tight mb-8">This collection is currently empty</p>
            <button 
              onClick={() => navigate('/search')}
              className="px-8 py-3 rounded-full border border-white/10 text-white/60 font-bold hover:bg-white hover:text-black transition-all"
            >
              Find Music
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
