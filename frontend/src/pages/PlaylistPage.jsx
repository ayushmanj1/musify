import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlay, FiTrash2, FiMoreHorizontal, FiList } from 'react-icons/fi'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongRow from '../components/ui/SongRow.jsx'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playlists, playSong, removeFromPlaylist, deletePlaylist } = usePlayer()

  const playlist = playlists.find(pl => pl.id === id)
  if (!playlist) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🫠</p>
        <p className="text-white font-bold text-xl">Playlist not found</p>
        <button onClick={() => navigate('/library')} className="mt-4 text-white hover:underline font-bold">Back to Library</button>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs, 0)
    }
  }

  const handleDelete = () => {
    deletePlaylist(id)
    navigate('/library')
  }

  return (
    <div className="pt-4 pb-32">
      {/* Header matching Spotify */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pt-4">
        {/* Large playlist image */}
        <div className="w-48 h-48 md:w-60 md:h-60 rounded-md bg-surface-hover flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0">
          {playlist.songs.length > 0 ? (
            <div className="grid grid-cols-2 w-full h-full">
              {playlist.songs.slice(0, 4).map((s, idx) => <img key={idx} src={s.thumbnail} alt="" className="w-full h-full object-cover" />)}
              {playlist.songs.length < 4 && Array.from({ length: 4 - Math.min(playlist.songs.length, 4) }).map((_, i) => (
                <div key={`empty-${i}`} className="w-full h-full bg-surface-active" />
              ))}
            </div>
          ) : <FiList className="text-6xl text-text-muted" />}
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter truncate leading-tight">
            {playlist.name}
          </h1>
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            <span className="font-bold text-white">Vybe User</span>
            <span>•</span>
            <span>{playlist.songs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 py-4 mb-6">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlayAll}
          disabled={playlist.songs.length === 0}
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-black rounded-full flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl">
          <FiPlay className="text-xl ml-1" fill="black" strokeWidth={0} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleDelete}
          className="text-text-secondary hover:text-white transition-colors" title="Delete playlist">
          <FiTrash2 className="text-2xl" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="text-text-secondary hover:text-white transition-colors">
          <FiMoreHorizontal className="text-3xl" />
        </motion.button>
      </div>

      {/* Songs */}
      {playlist.songs.length > 0 ? (
        <div className="flex flex-col">
          {/* Header row */}
          <div className="flex items-center px-4 py-2 text-text-secondary text-sm border-b border-white/10 mb-4 sticky top-16 bg-surface-raised/95 backdrop-blur z-20">
            <div className="w-5 text-center mr-4">#</div>
            <div className="flex-1">Title</div>
            <div className="w-12 text-center">⏱</div>
          </div>
          <div className="flex flex-col gap-1">
            {playlist.songs.map((song, i) => (
              <SongRow key={song.videoId} song={song} songs={playlist.songs} index={i} showIndex
                onRemove={(videoId) => removeFromPlaylist(id, videoId)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-t border-white/10 mt-6">
          <p className="text-white font-bold text-xl">Let's find something for your playlist</p>
          <button onClick={() => navigate('/search')} className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
            Find songs
          </button>
        </div>
      )}
    </div>
  )
}
