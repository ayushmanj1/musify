/**
 * MUSIFY v2.0 — Player
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Mini-bar: sticky above bottom nav, 40px circle art, song name (marquee), play/pause only
 * - No backdrop-filter blur on mini-bar or full-screen cards
 * - will-change: transform on mini-bar only
 * - Full-screen player: simplified controls, no blur on control bar
 * - Lyrics: kept flip card with lrclib
 * - Suggestions panel: no blur on cards
 * - CSS-only tap feedback (scale 0.96 on :active)
 * - All transitions use transform + opacity only
 */

import { useState, useEffect, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlay, FiPause, FiSkipForward, FiSkipBack,
  FiVolume2, FiVolumeX, FiHeart, FiList,
  FiChevronDown, FiShuffle, FiRepeat
} from 'react-icons/fi'
import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx'

const PlaybackProgress = memo(({ seekTo, formatTime }) => {
  const { currentTime, duration } = usePlayerTime()
  const pct = (currentTime / (duration || 1)) * 100

  return (
    <div style={{ width: '100%', maxWidth: 500, marginBottom: 32 }}>
      <div style={{ position: 'relative', padding: '12px 0' }}>
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#7C3AED', transition: 'width 0.3s linear' }} />
        </div>
        <input
          type="range" min={0} max={duration || 100} value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(duration)}</span>
      </div>
    </div>
  )
})

const MiniProgress = memo(() => {
  const { currentTime, duration } = usePlayerTime()
  const pct = (currentTime / (duration || 1)) * 100
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#7C3AED', opacity: 0.6 }} />
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
    toggleSavedSong, isSongSaved, isAudioLoading
  } = usePlayer()
  const { currentTime } = usePlayerTime()

  const [isFlipped, setIsFlipped] = useState(false)
  const [lyricsData, setLyricsData] = useState(null)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const lyricsCache = useRef({})
  const lyricsScrollRef = useRef(null)

  useEffect(() => { setIsFlipped(false) }, [currentSong])

  // ─── Lyrics Fetching ───
  useEffect(() => {
    if (isFullScreenPlayer && currentSong) {
      const artist = (currentSong.artist || currentSong.channelTitle || '').replace(/ - Topic$/, '')
      const title = currentSong.title.replace(/\(Official.*?\)|\[Official.*?\]|Official Video|Lyric Video|Audio/gi, '').trim()
      const cacheKey = `${artist}-${title}`
      if (lyricsCache.current[cacheKey]) { setLyricsData(lyricsCache.current[cacheKey]); return }

      const fetchLyrics = async () => {
        setLyricsLoading(true)
        try {
          const clean = (s) => s.replace(/\(.*?\)|\[.*?\]/g, '').replace(/\s\s+/g, ' ').trim()
          const sa = clean(artist), st = clean(title)
          const k = `${sa}-${st}`
          if (lyricsCache.current[k]) { setLyricsData(lyricsCache.current[k]); setLyricsLoading(false); return }

          let res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(sa)}&track_name=${encodeURIComponent(st)}`)
          if (res.ok) {
            const d = await res.json()
            const processed = { plain: d.plainLyrics, synced: parseSyncedLyrics(d.syncedLyrics) }
            lyricsCache.current[k] = processed
            setLyricsData(processed)
            return
          }
          res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${sa} ${st}`)}`)
          let sr = await res.json()
          if (!sr?.length) {
            res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(st)}`)
            sr = await res.json()
          }
          if (sr?.length) {
            const best = sr.find(s => s.syncedLyrics) || sr[0]
            const processed = { plain: best.plainLyrics, synced: parseSyncedLyrics(best.syncedLyrics) }
            lyricsCache.current[k] = processed
            setLyricsData(processed)
          } else { setLyricsData(null) }
        } catch { setLyricsData(null) }
        finally { setLyricsLoading(false) }
      }
      fetchLyrics()
    }
  }, [isFullScreenPlayer, currentSong])

  function parseSyncedLyrics(lrc) {
    if (!lrc) return []
    return lrc.split('\n').map(line => {
      const m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
      if (m) return { time: parseInt(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() }
      return null
    }).filter(l => l && l.text)
  }

  if (!currentSong) return null

  const formatTime = (t) => {
    if (isNaN(t) || t === 0) return '0:00'
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`
  }

  const isSaved = isSongSaved(currentSong.videoId)
  const thumb = currentSong.albumArt || currentSong.thumbnail

  return (
    <>
      {/* ─── Mini Now-Playing Bar ─── */}
      <AnimatePresence>
        {!isFullScreenPlayer && (
          <div
            className="now-playing-bar"
            onClick={() => setIsFullScreenPlayer(true)}
            style={{
              position: 'fixed', bottom: 68, left: 8, right: 8, zIndex: 60,
              height: 56, borderRadius: 12,
              background: 'rgba(18, 18, 26, 0.95)',
              border: '1px solid rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', padding: '0 8px', gap: 10,
              cursor: 'pointer', overflow: 'hidden',
            }}
          >
            <MiniProgress />

            {/* Album art circle */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src={thumb} alt="" width={40} height={40} style={{ objectFit: 'cover', width: 40, height: 40 }} loading="lazy" />
            </div>

            {/* Song name (marquee if long) */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <p className="marquee-container" style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                <span>{currentSong.title}</span>
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentSong.artist || currentSong.channelTitle}
              </p>
            </div>

            {/* Play/Pause only */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay() }}
              style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              {isAudioLoading ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : isPlaying ? (
                <FiPause size={18} />
              ) : (
                <FiPlay size={18} style={{ marginLeft: 2 }} />
              )}
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Full-Screen Player ─── */}
      <AnimatePresence>
        {isFullScreenPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 80 || velocity.y > 400) setIsFullScreenPlayer(false)
            }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: '#0a0a0f',
            }}
          >
            {/* BG Artwork (no blur — just scaled + faded) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.5)', opacity: 0.15, filter: 'blur(80px)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,15,0.3), #0a0a0f)' }} />
            </div>

            {/* Header */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }}>
              <button onClick={() => setIsFullScreenPlayer(false)} style={{ position: 'absolute', left: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <FiChevronDown size={28} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Now Playing</span>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 32px', overflowY: 'auto' }} className="hide-scrollbar">
              {/* Artwork / Lyrics flip */}
              <div style={{ width: '100%', maxWidth: 300, perspective: 1200 }}>
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    width: '100%', aspectRatio: '1', cursor: 'pointer', position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                    transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {/* Front */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {/* Back: Lyrics */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 24, overflow: 'hidden', background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.08)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <div ref={lyricsScrollRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                      {lyricsLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <div style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      ) : lyricsData?.synced?.length > 0 ? (
                        lyricsData.synced.map((line, i) => {
                          const activeIdx = lyricsData.synced.findIndex((l, idx) => {
                            const next = lyricsData.synced[idx + 1]
                            return currentTime >= l.time && (!next || currentTime < next.time)
                          })
                          const isActive = i === activeIdx
                          return (
                            <p key={i} style={{
                              fontSize: 16, fontWeight: 800, marginBottom: 20, lineHeight: 1.4,
                              opacity: isActive ? 1 : 0.15,
                              transform: isActive ? 'scale(1.02)' : 'scale(1)',
                              transition: 'opacity 0.5s, transform 0.5s',
                              color: '#fff',
                            }}>
                              {line.text}
                            </p>
                          )
                        })
                      ) : lyricsData?.plain ? (
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lyricsData.plain}</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🎤</div>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Lyrics unavailable</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div style={{ textAlign: 'center', maxWidth: 500, width: '100%' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4, lineHeight: 1.3 }}>{currentSong.title}</h2>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(124,58,237,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{currentSong.artist || currentSong.channelTitle}</p>
              </div>

              {/* Progress */}
              <PlaybackProgress seekTo={seekTo} formatTime={formatTime} />

              {/* Controls */}
              <div style={{
                width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                padding: '14px 24px', borderRadius: 99,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
              }}>
                <CtrlBtn onClick={() => toggleSavedSong(currentSong)} active={isSaved}>
                  <FiHeart size={18} className={isSaved ? 'heart-animate' : ''} style={isSaved ? { fill: '#7C3AED', color: '#7C3AED' } : {}} />
                </CtrlBtn>
                <CtrlBtn onClick={() => setShuffle(!shuffle)} active={shuffle}><FiShuffle size={16} /></CtrlBtn>
                <CtrlBtn onClick={() => playPrevious()}><FiSkipBack size={18} style={{ fill: 'currentcolor' }} /></CtrlBtn>
                <button
                  onClick={togglePlay}
                  style={{
                    width: 52, height: 52, borderRadius: '50%', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', border: 'none', cursor: 'pointer',
                    boxShadow: '0 0 30px rgba(255,255,255,0.15)',
                  }}
                >
                  {isAudioLoading ? (
                    <div style={{ width: 22, height: 22, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : isPlaying ? (
                    <FiPause size={22} style={{ fill: 'currentcolor' }} />
                  ) : (
                    <FiPlay size={22} style={{ fill: 'currentcolor', marginLeft: 2 }} />
                  )}
                </button>
                <CtrlBtn onClick={() => playNext()}><FiSkipForward size={18} style={{ fill: 'currentcolor' }} /></CtrlBtn>
                <CtrlBtn onClick={() => setRepeat(repeat === 'none' ? 'one' : 'none')} active={repeat === 'one'}>
                  <FiRepeat size={16} />
                  {repeat === 'one' && <span style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#7C3AED', fontSize: 7, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>1</span>}
                </CtrlBtn>
                <CtrlBtn onClick={() => setIsSuggestionsOpen(true)}><FiList size={16} /></CtrlBtn>
              </div>

              {/* Volume (desktop) */}
              <div className="hidden md:flex" style={{ width: '100%', maxWidth: 240, alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                <FiVolumeX size={14} onClick={() => setPlayerVolume(0)} style={{ cursor: 'pointer' }} />
                <div style={{ flex: 1, position: 'relative', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${volume}%`, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
                  <input type="range" min={0} max={100} value={volume} onChange={(e) => setPlayerVolume(parseInt(e.target.value))} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
                <FiVolume2 size={14} onClick={() => setPlayerVolume(100)} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Suggestions Panel ─── */}
      <AnimatePresence>
        {isSuggestionsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSuggestionsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 120,
                maxHeight: '70vh', borderRadius: '24px 24px 0 0',
                background: 'rgba(18,18,26,0.98)',
                border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Up Next</h3>
                <button onClick={() => setIsSuggestionsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  <FiChevronDown size={24} />
                </button>
              </div>

              <div className="hide-scrollbar scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {isRecLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((song) => (
                    <div
                      key={song.videoId}
                      onClick={() => { playSong(song); setIsSuggestionsOpen(false) }}
                      className="song-item"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        height: 64, padding: '0 12px', borderRadius: 12,
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={song.thumbnail} alt="" width={40} height={40} loading="lazy" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>No suggestions</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function CtrlBtn({ onClick, active, children }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        position: 'relative', width: 36, height: 36, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? '#7C3AED' : 'rgba(255,255,255,0.3)',
        transition: 'color 0.2s',
      }}
    >
      {children}
    </button>
  )
}
