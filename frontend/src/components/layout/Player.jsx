import { useState, useEffect, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlay, FiPause, FiSkipForward, FiSkipBack, 
  FiVolume2, FiVolumeX, FiHeart, FiList, 
  FiChevronDown, FiShuffle, FiRepeat
} from 'react-icons/fi'
import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx'
import { haptics } from '../../utils/haptics.js'

const PlaybackProgress = memo(({ seekTo, formatTime }) => {
  const { currentTime, duration } = usePlayerTime()
  const progressPercent = (currentTime / (duration || 1)) * 100

  return (
    <div className="w-full max-w-[500px] mb-10">
      <div className="relative group py-4">
        <div className="absolute left-0 right-0 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div 
            className="h-full relative transition-none"
            style={{ width: `${progressPercent}%`, background: 'var(--lavender)' }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            seekTo(parseFloat(e.target.value))
            haptics.light()
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
      <div className="flex justify-between mt-1">
        <motion.span layout className="text-[11px] font-medium text-white/40 tabular-nums">{formatTime(currentTime)}</motion.span>
        <motion.span layout className="text-[11px] font-medium text-white/40 tabular-nums">{formatTime(duration)}</motion.span>
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
    isSuggestionsOpen, setIsSuggestionsOpen, recommendations, isRecLoading, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    toggleSavedSong, isSongSaved
  } = usePlayer()
  const { currentTime } = usePlayerTime()

  const [isFlipped, setIsFlipped] = useState(false)
  const [lyricsData, setLyricsData] = useState(null)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const lyricsCache = useRef({})
  const lyricsScrollRef = useRef(null)

  useEffect(() => {
    setIsFlipped(false)
  }, [currentSong])

  const parseSyncedLyrics = (lrc) => {
    if (!lrc) return []
    return lrc.split('\n').map(line => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
      if (match) {
        const min = parseInt(match[1])
        const sec = parseFloat(match[2])
        return { time: min * 60 + sec, text: match[3].trim() }
      }
      return null
    }).filter(l => l && l.text)
  }

  useEffect(() => {
    if (isFlipped && lyricsData?.synced?.length > 0 && lyricsScrollRef.current) {
      const activeIndex = lyricsData.synced.findIndex((l, idx) => {
        const nextLine = lyricsData.synced[idx + 1]
        return currentTime >= l.time && (!nextLine || currentTime < nextLine.time)
      })
      if (activeIndex !== -1) {
        const activeLine = lyricsScrollRef.current.children[activeIndex]
        if (activeLine) {
          lyricsScrollRef.current.scrollTo({
            top: activeLine.offsetTop - 150,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [currentTime, isFlipped, lyricsData])

  useEffect(() => {
    if (isFullScreenPlayer && currentSong) {
      const cacheKey = `${currentSong.artist}-${currentSong.title}`
      if (lyricsCache.current[cacheKey]) {
        setLyricsData(lyricsCache.current[cacheKey])
        return
      }

      const fetchLyrics = async () => {
        setLyricsLoading(true)
        try {
          const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(currentSong.artist)}&track_name=${encodeURIComponent(currentSong.title)}`)
          const data = await res.json()
          const processed = {
            plain: data.plainLyrics,
            synced: parseSyncedLyrics(data.syncedLyrics)
          }
          lyricsCache.current[cacheKey] = processed
          setLyricsData(processed)
        } catch (err) {
          setLyricsData(null)
        } finally {
          setLyricsLoading(false)
        }
      }
      fetchLyrics()
    }
  }, [isFullScreenPlayer, currentSong])

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
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={() => {
                haptics.light()
                setIsFullScreenPlayer(true)
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y < -30 || velocity.y < -300) {
                  haptics.medium()
                  setIsFullScreenPlayer(true)
                }
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-[420px] h-[60px] rounded-full flex items-center px-2 cursor-pointer pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
              style={{ 
                background: 'rgba(20, 20, 25, 0.75)', 
                backdropFilter: 'blur(30px) saturate(200%)',
                WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <MiniPlayerProgress />
              
              <div className="flex items-center gap-3 flex-1 min-w-0 ml-1">
                <motion.div 
                  layoutId="player-artwork"
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-lg"
                >
                  <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.p layoutId="player-title" className="text-[13px] font-bold text-white truncate leading-tight">{currentSong.title}</motion.p>
                  <motion.p layoutId="player-artist" className="text-[10px] text-white/40 font-medium truncate uppercase tracking-wider">{currentSong.artist || currentSong.channelTitle}</motion.p>
                </div>
              </div>

              <div className="flex items-center gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    haptics.light()
                    setIsSuggestionsOpen(true)
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
                >
                  <FiList size={18} />
                </button>
                <button 
                  onClick={() => {
                    haptics.medium()
                    togglePlay()
                  }} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  {isPlaying ? <FiPause size={20} className="fill-current" /> : <FiPlay size={20} className="fill-current ml-0.5" />}
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
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                haptics.medium()
                setIsFullScreenPlayer(false)
              }
            }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#060608]"
          >
            {/* Background Blur Layer (Optimized) */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="absolute inset-0 z-0"
            >
              <img 
                src={currentSong.albumArt || currentSong.thumbnail} 
                alt="" 
                className="w-full h-full object-cover scale-150 blur-[100px] opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#060608]/80 to-[#060608]" />
            </motion.div>

            <div className="relative z-10 flex items-center justify-between p-6 md:p-10">
              <button 
                onClick={() => {
                  haptics.light()
                  setIsFullScreenPlayer(false)
                }} 
                className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white/50 active:scale-90 transition-transform"
              >
                <FiChevronDown size={28} />
              </button>
              
              <div className="text-center flex-1 mx-4">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">Now Playing</p>
                <p className="text-[12px] font-bold text-white/60 mt-1 truncate">{currentSong.albumName || 'Album'}</p>
              </div>

              <div className="flex items-center gap-2 glass-panel rounded-full px-3 py-2 shadow-[0_0_30px_rgba(167,139,250,0.15)]" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(30px) saturate(180%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => {
                    haptics.success()
                    toggleSavedSong(currentSong)
                  }} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isSongSaved(currentSong.videoId) ? 'text-lavender bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <FiHeart size={20} className={isSongSaved(currentSong.videoId) ? 'fill-current' : ''} />
                </button>
                <motion.button 
                  layoutId="suggestions"
                  onClick={() => {
                    haptics.light()
                    setIsSuggestionsOpen(true)
                  }} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isSuggestionsOpen ? 'text-lavender bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <FiList size={20} />
                </motion.button>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 md:px-16 overflow-y-auto hide-scrollbar pb-12">
              <div className="relative w-full max-w-[320px] md:max-w-[420px] mb-10" style={{ perspective: '1200px' }}>
                <motion.div 
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative w-full aspect-square cursor-pointer"
                  onClick={() => {
                    haptics.light()
                    setIsFlipped(!isFlipped)
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 400) {
                      haptics.medium()
                      setIsFlipped(offset.x < 0)
                    }
                  }}
                >
                  {/* Front: Artwork */}
                  <motion.div 
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 z-20 rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5"
                  >
                    <img src={currentSong.albumArt || currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                  </motion.div>

                  {/* Back: Lyrics */}
                  <motion.div 
                    style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
                    className="absolute inset-0 z-10 bg-black/40 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 overflow-hidden flex flex-col border border-white/10"
                  >
                    <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth" ref={lyricsScrollRef}>
                      {lyricsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-8 h-8 border-2 border-lavender/30 border-t-lavender rounded-full animate-spin" />
                        </div>
                      ) : lyricsData?.synced?.length > 0 ? (
                        lyricsData.synced.map((line, i) => {
                          const activeIndex = lyricsData.synced.findIndex((l, idx) => {
                            const nextLine = lyricsData.synced[idx + 1]
                            return currentTime >= l.time && (!nextLine || currentTime < nextLine.time)
                          })
                          const isActive = i === activeIndex
                          return (
                            <motion.p
                              key={i}
                              animate={{ 
                                opacity: isActive ? 1 : 0.2,
                                scale: isActive ? 1.05 : 1,
                                filter: isActive ? 'blur(0px)' : 'blur(1px)'
                              }}
                              className={`text-[22px] md:text-[28px] font-black mb-8 transition-all duration-700 text-left leading-tight tracking-tight ${isActive ? 'text-white' : 'text-white/60'}`}
                            >
                              {line.text}
                            </motion.p>
                          )
                        })
                      ) : lyricsData?.plain ? (
                        <p className="text-xl md:text-2xl font-bold text-white/80 leading-relaxed text-left whitespace-pre-wrap">{lyricsData.plain}</p>
                      ) : (
                        <p className="text-center text-white/20 font-black uppercase tracking-widest mt-20">No lyrics found</p>
                      )}
                    </div>
                    {/* Gradient Fades */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </motion.div>
                </motion.div>
              </div>

              <div className="w-full max-w-[500px] text-center mb-8">
                <motion.h2 layoutId="player-title" className="text-3xl md:text-4xl font-black text-white leading-tight mb-2 tracking-tight">{currentSong.title}</motion.h2>
                <motion.p layoutId="player-artist" className="text-base md:text-lg font-bold text-lavender/80 tracking-wide uppercase">{currentSong.artist || currentSong.channelTitle}</motion.p>
              </div>

              <PlaybackProgress seekTo={seekTo} formatTime={formatTime} />

              <div className="w-full max-w-[460px] mx-auto flex items-center justify-between px-6 py-4 rounded-[40px] shadow-[0_0_60px_rgba(167,139,250,0.2)] mb-8 transition-all" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => {
                    haptics.light()
                    setShuffle(!shuffle)
                  }} 
                  className={`text-2xl transition-all active:scale-90 ${shuffle ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiShuffle />
                </button>
                <div className="flex items-center gap-6 md:gap-8">
                  <button 
                    onClick={() => {
                      haptics.medium()
                      playPrevious()
                    }} 
                    className="text-3xl text-white/40 hover:text-white active:scale-90 transition-all"
                  >
                    <FiSkipBack className="fill-current" />
                  </button>
                  <button 
                    onClick={() => {
                      haptics.medium()
                      togglePlay()
                    }} 
                    className="w-20 h-20 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <FiPause size={32} className="fill-current" /> : <FiPlay size={32} className="fill-current ml-2" />}
                  </button>
                  <button 
                    onClick={() => {
                      haptics.medium()
                      playNext()
                    }} 
                    className="text-3xl text-white/40 hover:text-white active:scale-90 transition-all"
                  >
                    <FiSkipForward className="fill-current" />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    haptics.light()
                    handleRepeatToggle()
                  }} 
                  className={`relative text-2xl transition-all active:scale-90 ${repeat !== 'none' ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiRepeat />
                  {repeat === 'one' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-lavender text-white text-[7px] font-black rounded-full flex items-center justify-center">1</span>}
                </button>
              </div>

              <div className="w-full max-w-[280px] mt-6 flex items-center gap-4 text-white/10">
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
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
            />
            <motion.div
              layoutId="suggestions"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] h-[580px] z-[120] rounded-[40px] overflow-hidden flex flex-col bg-[#0c0c0e]/90 backdrop-blur-3xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="px-8 pb-5 pt-8 flex items-center justify-between border-b border-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white">Up Next</h3>
                  <p className="text-xs text-lavender font-bold uppercase tracking-widest mt-1">AI Suggestions</p>
                </div>
                <button 
                  onClick={() => {
                    haptics.light()
                    setIsSuggestionsOpen(false)
                  }}
                  className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white/50 active:scale-90 transition-transform"
                >
                  <FiChevronDown size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 hide-scrollbar scroll-smooth">
                {isRecLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-lavender/30 border-t-lavender rounded-full animate-spin" />
                  </div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((song, i) => (
                    <motion.div
                      key={song.videoId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                      whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => { 
                        haptics.light()
                        playSong(song)
                        setIsSuggestionsOpen(false) 
                      }}
                      className="flex items-center gap-4 p-3 rounded-[20px] cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg relative">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FiPlay className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-bold text-white truncate group-hover:text-lavender transition-colors">{song.title}</h4>
                        <p className="text-[12px] text-white/40 truncate font-medium uppercase tracking-wider">{song.artist}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 text-white/20 font-black uppercase tracking-[0.2em]">No suggestions</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
