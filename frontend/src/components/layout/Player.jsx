import { useState, useEffect, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiPause, FiSkipForward, FiSkipBack, 
  FiVolume2, FiVolumeX, FiHeart, FiList, 
  FiPlus, FiChevronDown, FiShuffle, FiRepeat, 
  FiShare2, FiMoreVertical 
} from 'react-icons/fi'
import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx'

const PlaybackProgress = memo(({ seekTo, formatTime }) => {
  const { currentTime, duration } = usePlayerTime()
  const progressPercent = (currentTime / (duration || 1)) * 100

  return (
    <div className="w-full max-w-[500px] mb-10">
      <div className="relative group py-4">
        <div className="absolute left-0 right-0 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div 
            className="h-full relative transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%`, background: 'var(--lavender)' }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] font-medium text-white/20 tabular-nums">{formatTime(currentTime)}</span>
        <span className="text-[11px] font-medium text-white/20 tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  )
})

const MiniPlayerProgress = memo(() => {
  const { currentTime, duration } = usePlayerTime()
  const progressPercent = (currentTime / (duration || 1)) * 100
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
      <div className="h-full bg-lavender/40" style={{ width: `${progressPercent}%` }} />
    </div>
  )
})

export default function Player() {
  const { 
    currentSong, isPlaying, togglePlay, 
    seekTo, volume, setPlayerVolume, playNext, playPrevious,
    isFullScreenPlayer, setIsFullScreenPlayer,
    setSongToAdd, setIsSidebarExpanded,
    isSuggestionsOpen, setIsSuggestionsOpen, recommendations, isRecLoading, playSong,
    shuffle, setShuffle, repeat, setRepeat
  } = usePlayer()

  const playerRef = useRef(null)

  if (!currentSong) return null

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleRepeatToggle = () => {
    if (repeat === 'none') setRepeat('all')
    else if (repeat === 'all') setRepeat('one')
    else setRepeat('none')
  }

  return (
    <>
      <AnimatePresence>
        {!isFullScreenPlayer && (
          <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex justify-center px-4 z-[60] pointer-events-none">
            <motion.div 
              layoutId="player-container"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={() => setIsFullScreenPlayer(true)}
              className="w-full max-w-[460px] h-[64px] rounded-2xl flex items-center px-4 cursor-pointer pointer-events-auto shadow-2xl glass-panel relative overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <MiniPlayerProgress />
              
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <motion.div 
                  layoutId="player-artwork"
                  className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-lg"
                >
                  <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.p layoutId="player-title" className="text-[13px] font-bold text-white truncate leading-tight">{currentSong.title}</motion.p>
                  <motion.p layoutId="player-artist" className="text-[10px] text-white/30 font-medium truncate uppercase tracking-wider">{currentSong.artist || currentSong.channelTitle}</motion.p>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/5 transition-all">
                  {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} className="ml-0.5" />}
                </button>
                <button onClick={playNext} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <FiSkipForward size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullScreenPlayer && (
          <motion.div 
            layoutId="player-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#060608]"
          >
            {/* Background Blur Layer (Optimized) */}
            <div className="absolute inset-0 z-0">
              <img 
                src={currentSong.albumArt || currentSong.thumbnail} 
                alt="" 
                className="w-full h-full object-cover scale-150 blur-[100px] opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060608]/80 to-[#060608]" />
            </div>

            <div className="relative z-10 flex items-center justify-between p-6 md:p-10">
              <button onClick={() => setIsFullScreenPlayer(false)} className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white/50"><FiChevronDown size={24} /></button>
              <div className="text-center">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Now Playing</p>
                <p className="text-[12px] font-bold text-white/40">{currentSong.albumName || 'Album'}</p>
              </div>
              <button className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white/50"><FiMoreVertical size={20} /></button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 md:px-16 overflow-y-auto hide-scrollbar pb-12">
              <motion.div 
                layoutId="player-artwork"
                className="relative w-full max-w-[320px] md:max-w-[380px] aspect-square rounded-[32px] overflow-hidden mb-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
              >
                <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
              </motion.div>

              <div className="w-full max-w-[500px] text-center mb-10">
                <motion.h2 layoutId="player-title" className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">{currentSong.title}</motion.h2>
                <motion.p layoutId="player-artist" className="text-base md:text-lg font-bold text-lavender/60 tracking-wide uppercase">{currentSong.artist || currentSong.channelTitle}</motion.p>
              </div>

              <PlaybackProgress seekTo={seekTo} formatTime={formatTime} />

              <div className="w-full max-w-[500px] flex items-center justify-between mb-12">
                <button onClick={() => setShuffle(!shuffle)} className={`text-2xl transition-all ${shuffle ? 'text-lavender' : 'text-white/10 hover:text-white/40'}`}><FiShuffle /></button>
                <div className="flex items-center gap-8 md:gap-12">
                  <button onClick={playPrevious} className="text-3xl text-white/30 hover:text-white active:scale-90 transition-all"><FiSkipBack className="fill-current" /></button>
                  <button onClick={togglePlay} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-90 transition-all">
                    {isPlaying ? <FiPause size={36} className="fill-current" /> : <FiPlay size={36} className="fill-current ml-2" />}
                  </button>
                  <button onClick={playNext} className="text-3xl text-white/30 hover:text-white active:scale-90 transition-all"><FiSkipForward className="fill-current" /></button>
                </div>
                <button onClick={handleRepeatToggle} className={`relative text-2xl transition-all ${repeat !== 'none' ? 'text-lavender' : 'text-white/10 hover:text-white/40'}`}>
                  <FiRepeat />
                  {repeat === 'one' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-lavender text-white text-[7px] font-black rounded-full flex items-center justify-center">1</span>}
                </button>
              </div>

              <div className="w-full max-w-[500px] flex items-center justify-around text-white/20">
                <button className="flex flex-col items-center gap-2 hover:text-lavender transition-all"><FiHeart size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Like</span></button>
                <button onClick={() => { setSongToAdd(currentSong); setIsSidebarExpanded(true); }} className="flex flex-col items-center gap-2 hover:text-lavender transition-all"><FiPlus size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Add</span></button>
                <button className="flex flex-col items-center gap-2 hover:text-lavender transition-all"><FiShare2 size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Share</span></button>
                <button onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)} className={`flex flex-col items-center gap-2 transition-all ${isSuggestionsOpen ? 'text-lavender' : 'hover:text-white/40'}`}><FiList size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Next</span></button>
              </div>

              <div className="w-full max-w-[280px] mt-12 flex items-center gap-4 text-white/10">
                <FiVolumeX onClick={() => setPlayerVolume(0)} className="cursor-pointer hover:text-white transition-colors" />
                <div className="flex-1 relative h-1 rounded-full overflow-hidden group" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="absolute left-0 top-0 h-full group-hover:bg-lavender transition-colors" style={{ width: `${volume}%`, background: 'rgba(255,255,255,0.2)' }} />
                  <input type="range" min="0" max="100" value={volume} onChange={(e) => setPlayerVolume(parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                </div>
                <FiVolume2 onClick={() => setPlayerVolume(100)} className="cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuggestionsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuggestionsOpen(false)}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[75vh] z-[120] rounded-t-[40px] overflow-hidden flex flex-col bg-[#0c0c0e] border-t border-white/5 shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black text-white">Up Next</h3>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">AI Recommendations</p>
                </div>
                <button 
                  onClick={() => setIsSuggestionsOpen(false)}
                  className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white/40"
                >
                  <FiChevronDown size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
                {isRecLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
                  </div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((song, i) => (
                    <motion.div
                      key={song.videoId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { playSong(song); setIsSuggestionsOpen(false); }}
                      className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-white truncate">{song.title}</h4>
                        <p className="text-[12px] text-white/30 truncate font-medium uppercase tracking-wider">{song.artist}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-lavender/10 text-lavender">
                        <FiPlay size={14} className="fill-current ml-0.5" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 text-white/10 font-black uppercase tracking-[0.3em]">No predictions found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
