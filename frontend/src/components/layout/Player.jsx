import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiPause, FiSkipForward, FiSkipBack, 
  FiVolume2, FiVolumeX, FiHeart, FiList, 
  FiPlus, FiChevronDown, FiShuffle, FiRepeat, 
  FiShare2, FiMoreVertical 
} from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

// Optimized Progress Bar Component to prevent parent re-renders
const PlaybackProgress = memo(({ currentTime, duration, seekTo, progressPercent, formatTime }) => {
  return (
    <div className="w-full max-w-[500px] mb-10">
      <div className="relative group py-4">
        <div className="absolute left-0 right-0 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-lavender shadow-[0_0_15px_rgba(167,139,250,0.6)] relative transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <div className="flex justify-between mt-2">
        <span className="text-[12px] font-bold text-white/40 tabular-nums">{formatTime(currentTime)}</span>
        <span className="text-[12px] font-bold text-white/40 tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  )
})

export default function Player() {
  const { 
    currentSong, isPlaying, togglePlay, currentTime, duration, 
    seekTo, volume, setPlayerVolume, playNext, playPrevious,
    isFullScreenPlayer, setIsFullScreenPlayer,
    setSongToAdd, setIsSidebarExpanded,
    isSuggestionsOpen, setIsSuggestionsOpen, recommendations, isRecLoading, playSong,
    shuffle, setShuffle, repeat, setRepeat
  } = usePlayer()

  if (!currentSong) return null

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = (currentTime / (duration || 1)) * 100

  const handleRepeatToggle = () => {
    if (repeat === 'none') setRepeat('all')
    else if (repeat === 'all') setRepeat('one')
    else setRepeat('none')
  }

  return (
    <>
      {/* 1. MINI PLAYER BAR - Efficient Glass Capsule */}
      <AnimatePresence>
        {!isFullScreenPlayer && (
          <div className="fixed bottom-24 md:bottom-8 left-0 right-0 flex justify-center px-4 z-[60] pointer-events-none">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-[500px] h-[56px] bg-[#121212]/80 backdrop-blur-md rounded-full flex items-center px-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] cursor-pointer border border-white/10 pointer-events-auto hover:scale-[1.03] transition-transform duration-300 will-change-transform"
              onClick={() => setIsFullScreenPlayer(true)}
            >
              {/* Minimalist Progress Line */}
              <div className="absolute bottom-1 left-8 right-8 h-[1px] bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-lavender shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                  <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-white truncate leading-tight">{currentSong.title}</p>
                  <p className="text-[9px] text-white/30 font-black truncate uppercase tracking-[0.1em]">{currentSong.artist || currentSong.channelTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-3 px-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={playPrevious} className="text-white/30 hover:text-white transition-colors p-2 hidden sm:block"><FiSkipBack size={16} /></button>
                <button 
                  onClick={togglePlay} 
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-lg active:scale-90 transition-all hover:scale-110"
                >
                  {isPlaying ? <FiPause size={16} className="fill-current" /> : <FiPlay size={16} className="fill-current ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-white/30 hover:text-white transition-colors p-2"><FiSkipForward size={16} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. FULL SCREEN PLAYER - Premium Translucent Transition */}
      <AnimatePresence>
        {isFullScreenPlayer && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 250 }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#050505]/95 backdrop-blur-3xl overflow-hidden will-change-transform"
          >
            {/* Optimized Background Layer */}
            <div className="absolute inset-0 z-0">
              <img 
                src={currentSong.albumArt || currentSong.thumbnail} 
                alt="" 
                className="w-full h-full object-cover scale-110 blur-[100px] opacity-40 will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]" />
            </div>

            <div className="relative z-10 flex items-center justify-between p-6 md:p-10">
              <button onClick={() => setIsFullScreenPlayer(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"><FiChevronDown className="text-2xl" /></button>
              <div className="text-center">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-1">Now Playing</p>
                <p className="text-[13px] font-bold text-white/80">{currentSong.albumName || 'Musify Premium'}</p>
              </div>
              <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"><FiMoreVertical className="text-xl" /></button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 md:px-16 overflow-y-auto hide-scrollbar pb-12">
              <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] mb-10 group will-change-transform">
                <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-[inherit] pointer-events-none" />
              </div>

              <div className="w-full max-w-[500px] text-center mb-8">
                <h2 className="text-[28px] md:text-[36px] font-black text-white leading-tight mb-2 tracking-tight">{currentSong.title}</h2>
                <p className="text-[16px] md:text-[18px] font-bold text-lavender/80 tracking-wide">{currentSong.artist || currentSong.channelTitle}</p>
              </div>

              {/* Progress Section - Isolated Component */}
              <PlaybackProgress 
                currentTime={currentTime} 
                duration={duration} 
                seekTo={seekTo} 
                progressPercent={progressPercent} 
                formatTime={formatTime} 
              />

              <div className="w-full max-w-[500px] flex items-center justify-between mb-10">
                <button onClick={() => setShuffle(!shuffle)} className={`text-2xl transition-all ${shuffle ? 'text-lavender' : 'text-white/30 hover:text-white'}`}><FiShuffle /></button>
                <div className="flex items-center gap-8 md:gap-10">
                  <button onClick={playPrevious} className="text-3xl md:text-4xl text-white/60 hover:text-white active:scale-90 transition-all"><FiSkipBack className="fill-current" /></button>
                  <button onClick={togglePlay} className="w-20 h-20 md:w-22 md:h-22 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-90 transition-all">
                    {isPlaying ? <FiPause className="text-4xl fill-current" /> : <FiPlay className="text-4xl fill-current ml-2" />}
                  </button>
                  <button onClick={playNext} className="text-3xl md:text-4xl text-white/60 hover:text-white active:scale-90 transition-all"><FiSkipForward className="fill-current" /></button>
                </div>
                <button onClick={handleRepeatToggle} className={`relative text-2xl transition-all ${repeat !== 'none' ? 'text-lavender' : 'text-white/30 hover:text-white'}`}>
                  <FiRepeat />
                  {repeat === 'one' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-lavender text-black text-[7px] font-black rounded-full flex items-center justify-center">1</span>}
                </button>
              </div>

              <div className="w-full max-w-[500px] flex items-center justify-around text-white/30">
                <button className="flex flex-col items-center gap-1 hover:text-lavender transition-all"><FiHeart className="text-2xl" /><span className="text-[9px] font-black uppercase tracking-widest">Like</span></button>
                <button onClick={() => { setSongToAdd(currentSong); setIsSidebarExpanded(true); }} className="flex flex-col items-center gap-1 hover:text-lavender transition-all"><FiPlus className="text-2xl" /><span className="text-[9px] font-black uppercase tracking-widest">Add</span></button>
                <button className="flex flex-col items-center gap-1 hover:text-lavender transition-all"><FiShare2 className="text-2xl" /><span className="text-[9px] font-black uppercase tracking-widest">Share</span></button>
                <button onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)} className={`flex flex-col items-center gap-1 transition-all ${isSuggestionsOpen ? 'text-lavender' : 'hover:text-white'}`}><FiList className="text-2xl" /><span className="text-[9px] font-black uppercase tracking-widest">Up Next</span></button>
              </div>

              <div className="w-full max-w-[280px] mt-10 flex items-center gap-4 text-white/20">
                <FiVolumeX onClick={() => setPlayerVolume(0)} className="cursor-pointer hover:text-white transition-colors" />
                <div className="flex-1 relative h-1 bg-white/10 rounded-full overflow-hidden group">
                  <div className="absolute left-0 top-0 h-full bg-white/40 group-hover:bg-lavender transition-colors" style={{ width: `${volume}%` }} />
                  <input type="range" min="0" max="100" value={volume} onChange={(e) => setPlayerVolume(parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                </div>
                <FiVolume2 onClick={() => setPlayerVolume(100)} className="cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Smart Suggestions Panel - Premium Glass Sheet */}
      <AnimatePresence>
        {isSuggestionsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuggestionsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[70vh] bg-black/40 backdrop-blur-3xl z-[120] rounded-t-[40px] overflow-hidden flex flex-col border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Up Next</h3>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Based on your vibe</p>
                </div>
                <button 
                  onClick={() => setIsSuggestionsOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                >
                  <FiChevronDown className="text-2xl" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                {isRecLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-10 h-10 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
                  </div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((song, i) => (
                    <motion.div
                      key={song.videoId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { playSong(song); setIsSuggestionsOpen(false); }}
                      className="flex items-center gap-4 p-3 rounded-[24px] hover:bg-white/10 cursor-pointer group transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="w-14 h-14 rounded-[16px] overflow-hidden shadow-lg">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-bold text-white truncate">{song.title}</h4>
                        <p className="text-[12px] text-white/40 truncate font-medium">{song.artist}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-lavender/20 text-lavender flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <FiPlay size={14} className="fill-current ml-0.5" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 text-white/20 font-bold uppercase tracking-[0.3em]">No recommendations found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
