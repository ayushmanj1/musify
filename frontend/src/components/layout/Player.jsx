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

  // Throttle lyrics scroll to once every 500ms
  const lastScrollTime = useRef(0)
  useEffect(() => {
    const now = Date.now()
    if (isFlipped && lyricsData?.synced?.length > 0 && lyricsScrollRef.current && now - lastScrollTime.current > 500) {
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
          lastScrollTime.current = now
        }
      }
    }
  }, [currentTime, isFlipped, lyricsData])

  useEffect(() => {
    if (isFullScreenPlayer && currentSong) {
      const artist = (currentSong.artist || currentSong.channelTitle || '').replace(/ - Topic$/, '')
      const title = currentSong.title.replace(/\(Official.*?\)|\[Official.*?\]|Official Video|Lyric Video|Audio/gi, '').trim()
      
      const cacheKey = `${artist}-${title}`
      if (lyricsCache.current[cacheKey]) {
        setLyricsData(lyricsCache.current[cacheKey])
        return
      }

      const fetchLyrics = async () => {
        setLyricsLoading(true)
        try {
          const cleanString = (str) => {
            return str
              .replace(/\(Official.*?\)|\[Official.*?\]|Official Video|Lyric Video|Audio|Full Video|HD|4K|Video/gi, '')
              .replace(/\(Lyrics\)|\[Lyrics\]|Lyrics/gi, '')
              .replace(/\(feat\..*?\)|\[feat\..*?\]|ft\..*?|feat\./gi, '')
              .replace(/\(.*?\)|\[.*?\]/g, '')
              .replace(/\s\s+/g, ' ')
              .trim()
          }

          const searchArtist = cleanString(artist)
          const searchTitle = cleanString(title)
          const cacheKey = `${searchArtist}-${searchTitle}`

          if (lyricsCache.current[cacheKey]) {
            setLyricsData(lyricsCache.current[cacheKey])
            setLyricsLoading(false)
            return
          }

          // Stage 1: Try Direct Get
          let res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(searchArtist)}&track_name=${encodeURIComponent(searchTitle)}`)
          
          if (res.ok) {
            const data = await res.json()
            const processed = { plain: data.plainLyrics, synced: parseSyncedLyrics(data.syncedLyrics) }
            lyricsCache.current[cacheKey] = processed
            setLyricsData(processed)
            return
          }

          // Stage 2: Broad Search
          res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${searchArtist} ${searchTitle}`)}`)
          let searchResults = await res.json()

          if (!searchResults || searchResults.length === 0) {
            // Stage 3: Title-only Search (if artist is just a channel name)
            res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchTitle)}`)
            searchResults = await res.json()
          }

          if (searchResults && searchResults.length > 0) {
            // Find best match based on duration (if available) or just take the first with synced lyrics
            const bestMatch = searchResults.find(s => s.syncedLyrics) || searchResults[0]
            const processed = {
              plain: bestMatch.plainLyrics,
              synced: parseSyncedLyrics(bestMatch.syncedLyrics)
            }
            lyricsCache.current[cacheKey] = processed
            setLyricsData(processed)
          } else {
            throw new Error('Not found')
          }
        } catch (err) {
          console.error('[Lyrics] Fetch error:', err)
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
                  <p className="text-[13px] font-bold text-white truncate leading-tight">{currentSong.title}</p>
                  <p className="text-[10px] text-white/40 font-medium truncate uppercase tracking-wider">{currentSong.artist || currentSong.channelTitle}</p>
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
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 80 || velocity.y > 400) {
                haptics.medium()
                setIsFullScreenPlayer(false)
              }
            }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#000000] will-change-transform transform-gpu"
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

            <div className="relative z-10 flex items-center justify-between p-5 md:p-10">
              <button 
                onClick={() => {
                  haptics.light()
                  setIsFullScreenPlayer(false)
                }} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-btn flex items-center justify-center text-white/50 active:scale-90 transition-transform"
              >
                <FiChevronDown size={24} />
              </button>
              
              <div className="flex-1" />

              <div className="w-10 h-10 md:w-12 md:h-12" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-12 px-8 md:px-16 overflow-y-auto hide-scrollbar pb-12">
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
                    className="absolute inset-0 z-10 bg-[#0c0c0e]/80 backdrop-blur-xl rounded-[40px] p-10 overflow-hidden flex flex-col border border-white/5"
                  >
                    <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth [will-change:scroll-position]" ref={lyricsScrollRef}>
                      {lyricsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-10 h-10 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
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
                                opacity: isActive ? 1 : 0.15,
                                scale: isActive ? 1.05 : 1,
                                filter: isActive ? 'blur(0px)' : 'blur(2px)'
                              }}
                              className={`text-[20px] md:text-[24px] font-black mb-10 transition-all duration-700 text-left leading-[1.3] tracking-tighter ${isActive ? 'text-white' : 'text-white/40'}`}
                            >
                              {line.text}
                            </motion.p>
                          )
                        })
                      ) : lyricsData?.plain ? (
                        <p className="text-lg md:text-xl font-bold text-white/90 leading-relaxed text-left whitespace-pre-wrap py-4">{lyricsData.plain}</p>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                          <div className="text-4xl mb-4">🎤</div>
                          <p className="text-xs font-black uppercase tracking-[0.3em]">Lyrics unavailable</p>
                        </div>
                      )}
                    </div>
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 pointer-events-none rounded-[40px] border border-white/5 shadow-inner" />
                  </motion.div>
                </motion.div>
              </div>

              <div className="w-full max-w-[500px] text-center mb-12">
                <h2 className="text-base md:text-lg font-semibold text-white/90 leading-tight mb-1 tracking-tight">{currentSong.title}</h2>
                <p className="text-[10px] md:text-[12px] font-medium text-lavender/60 tracking-[0.2em] uppercase">{currentSong.artist || currentSong.channelTitle}</p>
              </div>

              <PlaybackProgress seekTo={seekTo} formatTime={formatTime} />

              <div className="w-full max-w-[480px] mx-auto flex items-center justify-center gap-5 md:gap-8 px-6 py-4 md:px-8 md:py-5 rounded-[45px] shadow-[0_40px_100px_rgba(0,0,0,0.7)] mb-10 transition-all border border-white/10" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(50px) saturate(200%)' }}>
                <button 
                  onClick={() => {
                    haptics.success()
                    toggleSavedSong(currentSong)
                  }} 
                  className={`text-xl transition-all active:scale-90 ${isSongSaved(currentSong.videoId) ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiHeart className={isSongSaved(currentSong.videoId) ? 'fill-current' : ''} />
                </button>

                <button 
                  onClick={() => {
                    haptics.light()
                    setShuffle(!shuffle)
                  }} 
                  className={`text-lg transition-all active:scale-90 relative ${shuffle ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiShuffle />
                  {shuffle && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-lavender rounded-full shadow-[0_0_8px_rgba(167,139,250,1)]" />}
                </button>

                <div className="flex items-center gap-4 md:gap-6">
                  <button 
                    onClick={() => {
                      haptics.medium()
                      playPrevious()
                    }} 
                    className="text-xl text-white/40 hover:text-white active:scale-90 transition-all"
                  >
                    <FiSkipBack className="fill-current" />
                  </button>
                  <button 
                    onClick={() => {
                      haptics.medium()
                      togglePlay()
                    }} 
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <FiPause size={24} className="fill-current" /> : <FiPlay size={24} className="fill-current ml-1" />}
                  </button>
                  <button 
                    onClick={() => {
                      haptics.medium()
                      playNext()
                    }} 
                    className="text-xl text-white/40 hover:text-white active:scale-90 transition-all"
                  >
                    <FiSkipForward className="fill-current" />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    haptics.light()
                    handleRepeatToggle()
                  }} 
                  className={`relative text-lg transition-all active:scale-90 ${repeat !== 'none' ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiRepeat />
                  {repeat === 'one' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-lavender text-white text-[7px] font-black rounded-full flex items-center justify-center">1</span>}
                  {repeat === 'all' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-lavender rounded-full shadow-[0_0_8px_rgba(167,139,250,1)]" />}
                </button>

                <button 
                  onClick={() => {
                    haptics.light()
                    setIsSuggestionsOpen(true)
                  }} 
                  className={`text-xl transition-all active:scale-90 ${isSuggestionsOpen ? 'text-lavender' : 'text-white/20 hover:text-white/60'}`}
                >
                  <FiList />
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
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] h-[580px] z-[120] rounded-[40px] overflow-hidden flex flex-col bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] will-change-transform"
            >
              <div className="px-8 pb-6 pt-8 flex items-center justify-between border-b border-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Up Next</h3>
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

              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scrollbar scroll-smooth">
                {isRecLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-10 h-10 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
                  </div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((song, i) => (
                    <motion.div
                      key={song.videoId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                      whileTap={{ scale: 0.96, backgroundColor: 'rgba(255,255,255,0.06)' }}
                      onClick={() => { 
                        haptics.light()
                        playSong(song)
                        setIsSuggestionsOpen(false) 
                      }}
                      className="flex items-center gap-5 p-4 rounded-[24px] cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl relative">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FiPlay className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[16px] font-bold text-white truncate group-hover:text-lavender transition-colors mb-1">{song.title}</h4>
                        <p className="text-[12px] text-white/40 truncate font-semibold uppercase tracking-wider">{song.artist}</p>
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
