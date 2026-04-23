import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiPause, FiSkipForward, FiSkipBack, FiVolume2, FiVolumeX, FiHeart, FiList, FiPlus, FiMoreHorizontal, FiMaximize2, FiShuffle, FiRepeat, FiMic, FiMonitor, FiPlusCircle, FiX } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function Player() {
  const { 
    currentSong, isPlaying, togglePlay, currentTime, duration, 
    seekTo, volume, setPlayerVolume, playNext, playPrevious,
    isRightPanelOpen, setIsRightPanelOpen, setIsSidebarExpanded, setSongToAdd
  } = usePlayer()

  const [isHoveringArt, setIsHoveringArt] = useState(false)

  if (!currentSong) return null

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = (currentTime / (duration || 1)) * 100

  return (
    <>
      {/* Right Now Playing Panel Overlay */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRightPanelOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-2 right-2 h-[calc(100vh-100px)] w-[320px] glass z-50 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-y-auto hide-scrollbar p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[15px] font-black tracking-widest uppercase text-white/40">Now Playing</span>
                <button onClick={() => setIsRightPanelOpen(false)} className="text-white/40 hover:text-white p-1 transition-colors"><FiX className="text-xl" /></button>
              </div>

              <div className="w-full aspect-square rounded-[20px] overflow-hidden shadow-2xl mb-8 group cursor-pointer relative">
                <img src={currentSong.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
              </div>

              <div className="flex items-start justify-between mb-8">
                <div className="min-w-0 pr-4">
                  <h2 className="text-[24px] font-bold text-white truncate leading-tight mb-1">{currentSong.title}</h2>
                  <p className="text-[15px] text-white/40 truncate font-medium">{currentSong.artist || currentSong.channelTitle}</p>
                </div>
                <button 
                  onClick={() => { setSongToAdd(currentSong); setIsSidebarExpanded(true); }}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
                >
                  <FiPlusCircle className="text-xl" />
                </button>
              </div>

              <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h4 className="text-[13px] font-black text-[#1DB954] mb-4 tracking-widest uppercase relative z-10">Artist Info</h4>
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 relative z-10 shadow-2xl border-2 border-white/10">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentSong.artist || currentSong.channelTitle)}&background=random`} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-[16px] font-bold text-white mb-1 relative z-10">{currentSong.artist || currentSong.channelTitle}</p>
                <p className="text-[13px] text-white/40 mb-4 relative z-10">Popular globally with a distinct vibe.</p>
                <button className="relative z-10 text-[12px] font-bold px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95">FOLLOW</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Playback Bar */}
      <div 
        className="fixed bottom-16 md:bottom-2 left-2 right-2 h-[72px] glass z-[60] flex items-center px-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-fade-in"
      >
        {/* Left: Info */}
        <div className="flex items-center gap-3 flex-1 md:w-[30%] min-w-0">
          <div 
            className="w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0 cursor-pointer relative group shadow-lg transition-transform active:scale-90"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          >
            <img src={currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <FiMaximize2 className="text-white text-xs" />
            </div>
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[14px] font-bold text-white hover:underline cursor-pointer truncate">{currentSong.title}</p>
            <p className="text-[11px] text-white/40 font-medium truncate">{currentSong.artist || currentSong.channelTitle}</p>
          </div>
          <button 
            onClick={() => { setSongToAdd(currentSong); setIsSidebarExpanded(true); }}
            className="text-white/40 hover:text-[#1DB954] transition-all transform active:scale-75 p-2"
          >
            <FiPlusCircle className="text-xl" />
          </button>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center justify-center gap-1 md:flex-1 md:max-w-xl px-2">
          <div className="flex items-center gap-5 md:gap-8">
            <button className="text-white/30 hover:text-white hidden md:block"><FiShuffle className="text-[16px]" /></button>
            <button onClick={playPrevious} className="text-white/60 hover:text-white active:scale-90 transition-transform"><FiSkipBack className="text-[22px] fill-current" /></button>
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <FiPause className="text-[20px] fill-current" /> : <FiPlay className="text-[20px] fill-current ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-white/60 hover:text-white active:scale-90 transition-transform"><FiSkipForward className="text-[22px] fill-current" /></button>
            <button className="text-white/30 hover:text-white hidden md:block"><FiRepeat className="text-[16px]" /></button>
          </div>
          
          <div className="hidden md:flex items-center gap-3 w-full max-w-[480px]">
            <span className="text-[10px] text-white/30 font-bold min-w-[30px] text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group py-2 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full seek-bar h-1 z-10 relative cursor-pointer accent-[#1DB954]"
                style={{ background: `linear-gradient(to right, #1DB954 ${progressPercent}%, rgba(255,255,255,0.05) ${progressPercent}%)` }}
              />
            </div>
            <span className="text-[10px] text-white/30 font-bold min-w-[30px] tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
          <button className="text-white/30 hover:text-white p-2"><FiMic className="text-[18px]" /></button>
          <button className="text-white/30 hover:text-white p-2"><FiList className="text-[18px]" /></button>
          <div className="flex items-center gap-2 group ml-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all">
            <button onClick={() => setPlayerVolume(volume === 0 ? 80 : 0)} className="text-white/40 hover:text-white">
              {volume === 0 ? <FiVolumeX className="text-[18px]" /> : <FiVolume2 className="text-[18px]" />}
            </button>
            <div className="w-20 relative flex items-center">
               <input
                type="range"
                min={0} max={100} step={1}
                value={volume}
                onChange={(e) => setPlayerVolume(parseInt(e.target.value))}
                className="w-full seek-bar h-1 accent-white"
                style={{ background: `linear-gradient(to right, white ${volume}%, rgba(255,255,255,0.1) ${volume}%)` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
