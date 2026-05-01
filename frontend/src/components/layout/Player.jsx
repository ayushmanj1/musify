/**
 * MUSIFY — Player (Mini + Full Screen Now Playing)
 * ─── Mini Player: 64px above bottom nav
 * ─── Full Screen: slides up with album blur background
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { shareSong, copySongLink } from '../../utils/share.js'
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiHeart, FiShuffle, FiRepeat, FiChevronDown,
  FiVolume2, FiShare2, FiMonitor, FiClock, FiList, FiMic,
} from 'react-icons/fi'
import { EqualizerPanel, EqualizerButton } from '../ui/EqualizerPanel.jsx'
import { LyricsScreen } from '../ui/LyricsScreen.jsx'
import { FlipAlbumArt } from '../ui/FlipAlbumArt.jsx'

/* ─── Time Formatter ─── */
function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/* ─── Loading Spinner ─── */
function Spinner({ size = 18, light = true }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
      borderTopColor: light ? '#fff' : '#000',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

/* ─── Progress Hook ─── */
function usePlayerTime() {
  const { currentSong } = usePlayer()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    // Use a polling approach to get time from context
    const interval = setInterval(() => {
      const audio = document.querySelector('audio') || window.__musifyAudio
      if (audio) {
        setCurrentTime(audio.currentTime || 0)
        setDuration(audio.duration || 0)
      }
    }, 250)
    return () => clearInterval(interval)
  }, [currentSong])

  return { currentTime, duration }
}

/* ═══════════════════════════════════════════════════════
   PLAYER COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Player() {
  const {
    currentSong, isPlaying, togglePlay,
    seekTo, playNext, playPrevious,
    isFullScreenPlayer, setIsFullScreenPlayer,
    shuffle, setShuffle, repeat, setRepeat,
    toggleSavedSong, isSongSaved, isAudioLoading,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    recommendations, playSong,
    eqBands, onEQChange,
  } = usePlayer()

  const { currentTime, duration } = usePlayerTime()
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [showTimerSheet, setShowTimerSheet] = useState(false)
  const progressRef = useRef(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const saved = currentSong ? isSongSaved(currentSong.videoId) : false
  const [heartAnim, setHeartAnim] = useState(false)

  const handleToggleSave = () => {
    if (currentSong) {
      toggleSavedSong(currentSong)
      setHeartAnim(true)
      setTimeout(() => setHeartAnim(false), 300)
    }
  }

  /* ─── Touch Seeking ─── */
  const handleProgressTouch = useCallback((e, element) => {
    if (!element || !duration) return
    const rect = element.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    return pct * duration
  }, [duration])

  if (!currentSong) return null

  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/mqdefault.jpg`

  return (
    <>
      {/* ═══ MINI PLAYER ═══ */}
      {!isFullScreenPlayer && (
        <div
          onClick={() => setIsFullScreenPlayer(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--bottom-nav-h) + var(--safe-bottom) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 16px)',
            maxWidth: 374,
            height: 'var(--mini-player-h)',
            background: 'var(--bg-card)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 10,
            cursor: 'pointer',
            zIndex: 45,
            animation: 'miniPlayerEnter 200ms ease-out',
            willChange: 'transform',
            overflow: 'hidden',
          }}
        >
          {/* Album art */}
          <img src={thumb} alt="" width={48} height={48}
            style={{ borderRadius: 'var(--radius-base)', flexShrink: 0 }} />

          {/* Title + artist */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
              {currentSong.title}
            </p>
            <p className="truncate" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
              {currentSong.artist}
            </p>
          </div>

          {/* Heart */}
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleSave() }}
            style={{
              background: 'none', border: 'none', padding: 6, cursor: 'pointer',
              color: saved ? 'var(--accent)' : 'var(--text-secondary)',
              transform: heartAnim ? 'scale(1.35)' : 'scale(1)',
              transition: 'transform 300ms ease, color 200ms',
              touchAction: 'manipulation',
            }}
          >
            <FiHeart size={18} style={{ fill: saved ? 'currentcolor' : 'none' }} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            style={{
              background: 'none', border: 'none', padding: 6, cursor: 'pointer',
              color: 'var(--text-primary)', touchAction: 'manipulation',
            }}
          >
            {isAudioLoading ? <Spinner size={18} /> :
              isPlaying ? <FiPause size={18} /> : <FiPlay size={18} style={{ marginLeft: 2 }} />}
          </button>

          {/* ─── 2px accent progress bar at bottom ─── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            width: `${progress}%`, height: 2,
            background: 'var(--accent)',
            transition: 'width 250ms linear',
          }} />
        </div>
      )}

      {/* ═══ FULL SCREEN NOW PLAYING ═══ */}
      {isFullScreenPlayer && (
        <NowPlaying
          currentSong={currentSong}
          thumb={thumb}
          isPlaying={isPlaying}
          isAudioLoading={isAudioLoading}
          togglePlay={togglePlay}
          seekTo={seekTo}
          playNext={playNext}
          playPrevious={playPrevious}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeat={repeat}
          setRepeat={setRepeat}
          saved={saved}
          heartAnim={heartAnim}
          handleToggleSave={handleToggleSave}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          isSeeking={isSeeking}
          setIsSeeking={setIsSeeking}
          seekValue={seekValue}
          setSeekValue={setSeekValue}
          progressRef={progressRef}
          handleProgressTouch={handleProgressTouch}
          sleepTimer={sleepTimer}
          sleepTimerRemaining={sleepTimerRemaining}
          startSleepTimer={startSleepTimer}
          cancelSleepTimer={cancelSleepTimer}
          showTimerSheet={showTimerSheet}
          setShowTimerSheet={setShowTimerSheet}
          recommendations={recommendations}
          playSong={playSong}
          eqBands={eqBands}
          onEQChange={onEQChange}
          onClose={() => setIsFullScreenPlayer(false)}
        />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   NOW PLAYING — Swipe-to-Dismiss + PC Minimize
   ═══════════════════════════════════════════════════════ */
function NowPlaying({
  currentSong, thumb, isPlaying, isAudioLoading, togglePlay,
  seekTo, playNext, playPrevious, shuffle, setShuffle, repeat, setRepeat,
  saved, heartAnim, handleToggleSave, progress, currentTime, duration,
  isSeeking, setIsSeeking, seekValue, setSeekValue, progressRef,
  handleProgressTouch,
  sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
  showTimerSheet, setShowTimerSheet, recommendations, playSong, onClose,
  eqBands, onEQChange,
}) {
  const containerRef = useRef(null)
  const bgRef = useRef(null)
  const albumRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startY: 0, currentY: 0, startTime: 0 })
  const [isClosing, setIsClosing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Equalizer Panel state
  const [showEQ, setShowEQ] = useState(false)
  const [eqBtnRect, setEqBtnRect] = useState(null)

  // Lyrics state
  const [showLyrics, setShowLyrics] = useState(false)

  // Suggestions popup state
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 480)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const closeWithAnimation = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => { setIsClosing(false); onClose() }, 320)
  }, [onClose])

  /* ─── Pointer Handlers (mobile swipe only) ─── */
  const onPointerDown = useCallback((e) => {
    if (!isMobile) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relY = e.clientY - rect.top
    const inTopZone = relY < rect.height * 0.3
    const inAlbum = albumRef.current && albumRef.current.contains(e.target)
    const scrollable = e.target.closest('[data-scrollable]')
    if (scrollable && scrollable.scrollTop > 0) return
    if (!inTopZone && !inAlbum) return

    dragRef.current = { isDragging: true, startY: e.clientY, currentY: e.clientY, startTime: Date.now() }
    el.setPointerCapture(e.pointerId)
    el.style.transition = 'none'
    if (bgRef.current) bgRef.current.style.transition = 'none'
    if (albumRef.current) albumRef.current.style.transition = 'none'
  }, [isMobile])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return
    const dy = Math.max(0, e.clientY - dragRef.current.startY)
    dragRef.current.currentY = e.clientY
    const el = containerRef.current
    if (!el) return
    const t = Math.min(dy / 400, 1)
    el.style.transform = `translateY(${dy}px) scale(${1 - t * 0.04})`
    el.style.opacity = `${1 - t * 0.3}`
    if (albumRef.current) albumRef.current.style.transform = `scale(${1 - t * 0.08})`
    if (bgRef.current) bgRef.current.style.filter = `blur(${80 - t * 60}px) brightness(0.35)`
  }, [])

  const onPointerUp = useCallback((e) => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false
    const dy = Math.max(0, e.clientY - dragRef.current.startY)
    const velocity = dy / Math.max(Date.now() - dragRef.current.startTime, 1)
    const el = containerRef.current
    if (!el) return

    if (dy > 120 || velocity > 0.5) {
      el.style.transition = 'transform 320ms cubic-bezier(0.32,0.72,0,1), opacity 320ms cubic-bezier(0.32,0.72,0,1)'
      el.style.transform = 'translateY(100%) scale(0.96)'
      el.style.opacity = '0'
      setTimeout(() => onClose(), 320)
    } else {
      const ease = '280ms cubic-bezier(0.32,0.72,0,1)'
      el.style.transition = `transform ${ease}, opacity ${ease}`
      el.style.transform = 'translateY(0) scale(1)'
      el.style.opacity = '1'
      if (albumRef.current) { albumRef.current.style.transition = `transform ${ease}`; albumRef.current.style.transform = 'scale(1)' }
      if (bgRef.current) { bgRef.current.style.transition = 'filter 280ms ease'; bgRef.current.style.filter = 'blur(80px) brightness(0.35)' }
    }
  }, [onClose])

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        willChange: 'transform', overscrollBehavior: 'none',
        animation: isClosing ? 'nowPlayingOut 320ms cubic-bezier(0.32,0.72,0,1) forwards' : 'slideUp 350ms cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(80px) brightness(0.35)', transform: 'scale(1.2)',
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.45)' }} />

      <div data-scrollable style={{
        position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: 390, width: '100%', margin: '0 auto', padding: '0 24px',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(var(--safe-bottom) + 24px)', touchAction: 'pan-y',
      }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'max(16px, env(safe-area-inset-top))', height: 56 }}>
          {isMobile ? (
            <button onClick={closeWithAnimation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, touchAction: 'manipulation' }}>
              <FiChevronDown size={28} />
            </button>
          ) : (
            <button
              onClick={closeWithAnimation}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', transition: 'background 150ms, transform 80ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FiChevronDown size={20} />
            </button>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Playing from Liked Songs</span>
          <button onClick={() => setShowTimerSheet(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sleepTimer?.active ? 'var(--accent)' : '#fff', padding: 4, touchAction: 'manipulation' }}>
            <FiClock size={24} />
          </button>
        </div>

        {/* Album Art Flip Card */}
        <FlipAlbumArt 
          albumRef={albumRef}
          song={currentSong}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onExpandLyrics={() => setShowLyrics(true)}
        />

        {/* Song Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="truncate" style={{ fontSize: 22, fontWeight: 700 }}>{currentSong.title}</p>
            <p className="truncate" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{currentSong.artist}</p>
          </div>
          <button onClick={handleToggleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: saved ? 'var(--accent)' : 'rgba(255,255,255,0.6)', animation: heartAnim ? 'heartPop 300ms ease' : 'none', touchAction: 'manipulation', flexShrink: 0 }}>
            <FiHeart size={24} style={{ fill: saved ? 'currentcolor' : 'none' }} />
          </button>
        </div>

        {/* Progress Bar */}
        <div ref={progressRef}
          onTouchStart={(e) => { setIsSeeking(true); const t = handleProgressTouch(e, progressRef.current); if (t !== undefined) setSeekValue(t) }}
          onTouchMove={(e) => { if (isSeeking) { const t = handleProgressTouch(e, progressRef.current); if (t !== undefined) setSeekValue(t) } }}
          onTouchEnd={() => { if (isSeeking) { seekTo(seekValue); setIsSeeking(false) } }}
          onClick={(e) => { const t = handleProgressTouch(e, progressRef.current); if (t !== undefined) seekTo(t) }}
          style={{ width: '100%', height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}
        >
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' }}>
            <div style={{ width: `${isSeeking ? (seekValue / (duration || 1)) * 100 : progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: isSeeking ? 'none' : 'width 250ms linear' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${isSeeking ? (seekValue / (duration || 1)) * 100 : progress}%`, transform: `translate(-50%, -50%) scale(${isSeeking ? 1.5 : 1})`, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: isSeeking ? 'none' : 'left 250ms linear, transform 150ms ease' }} />
          </div>
        </div>

        {/* Time stamps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 20 }}>
          <span>{fmt(isSeeking ? seekValue : currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <button onClick={() => setShuffle(!shuffle)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: shuffle ? 'var(--accent)' : 'rgba(255,255,255,0.6)', touchAction: 'manipulation' }}><FiShuffle size={20} /></button>
          <button onClick={playPrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#fff', touchAction: 'manipulation' }}><FiSkipBack size={22} style={{ fill: 'currentcolor' }} /></button>
          <button onClick={togglePlay} style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', touchAction: 'manipulation' }}>
            {isAudioLoading ? <Spinner size={22} light={false} /> : isPlaying ? <FiPause size={26} style={{ fill: 'currentcolor' }} /> : <FiPlay size={26} style={{ fill: 'currentcolor', marginLeft: 3 }} />}
          </button>
          <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#fff', touchAction: 'manipulation' }}><FiSkipForward size={22} style={{ fill: 'currentcolor' }} /></button>
          <button onClick={() => setRepeat(repeat === 'none' ? 'one' : 'none')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: repeat !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.6)', touchAction: 'manipulation' }}><FiRepeat size={20} /></button>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 'max(24px, var(--safe-bottom))' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => currentSong && copySongLink(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.5)', touchAction: 'manipulation' }}><FiMonitor size={18} /></button>
          </div>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <EqualizerButton isPlaying={isPlaying} isOpen={showEQ} onClick={(rect) => { setEqBtnRect(rect); setShowEQ(!showEQ); }} />
            
            {/* Up Next / Suggestions Button */}
            <button
              onClick={() => setShowSuggestions(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.5)', touchAction: 'manipulation' }}
            >
              <FiList size={18} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => currentSong && shareSong(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.5)', touchAction: 'manipulation' }}><FiShare2 size={18} /></button>
          </div>
        </div>


      </div>

      {/* Sleep Timer Bottom Sheet */}
      {showTimerSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowTimerSheet(false)} />
          <div style={{ position: 'relative', background: '#282828', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px 0', paddingBottom: 'max(24px, var(--safe-bottom))', width: '100%', maxWidth: 390, margin: '0 auto', animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)' }}>
            <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Stop audio in</h3>
            {sleepTimer?.active && (
              <p style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
                {sleepTimer.stopAfterCurrent ? 'End of track' : `${Math.ceil(sleepTimerRemaining / 60000)} minutes remaining`}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[{ label: '5 minutes', value: 5 }, { label: '10 minutes', value: 10 }, { label: '15 minutes', value: 15 }, { label: '30 minutes', value: 30 }, { label: '45 minutes', value: 45 }, { label: '1 hour', value: 60 }, { label: 'End of track', value: 'track' }].map(opt => (
                <button key={opt.label} onClick={() => { startSleepTimer(opt.value); setShowTimerSheet(false) }} style={{ padding: '16px 24px', background: 'none', border: 'none', color: '#fff', fontSize: 16, textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation' }}>{opt.label}</button>
              ))}
              {sleepTimer?.active && (
                <button onClick={() => { cancelSleepTimer(); setShowTimerSheet(false) }} style={{ padding: '16px 24px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation' }}>Turn off timer</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equalizer Panel */}
      <EqualizerPanel
        isOpen={showEQ}
        onClose={() => setShowEQ(false)}
        onEQChange={onEQChange}
        currentBands={eqBands || [0,0,0,0,0]}
        isPlaying={isPlaying}
        buttonRect={eqBtnRect}
      />

      {/* Lyrics Screen */}
      <LyricsScreen
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        currentSong={currentSong}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
      />

      {/* Suggested Songs Popup */}
      {showSuggestions && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 115, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setShowSuggestions(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              width: '100%', maxWidth: 390, margin: '0 auto',
              animation: 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)',
              paddingBottom: 'max(24px, var(--safe-bottom))',
            }}
          >
            {/* Handle + Header */}
            <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Up Next</h3>
                <button onClick={() => setShowSuggestions(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
                  <FiChevronDown size={22} />
                </button>
              </div>
            </div>

            {/* Song List */}
            <div style={{ overflowY: 'auto', padding: '4px 16px 16px' }} className="hide-scrollbar">
              {recommendations && recommendations.length > 0 ? recommendations.map((rec, i) => (
                <div
                  key={rec.videoId + i}
                  onClick={() => { playSong(rec); setShowSuggestions(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px', borderRadius: 12,
                    cursor: 'pointer', touchAction: 'manipulation',
                    transition: 'background 150ms',
                  }}
                  onTouchStart={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onTouchEnd={e => e.currentTarget.style.background = 'transparent'}
                >
                  <img
                    src={rec.thumbnail || `https://i.ytimg.com/vi/${rec.videoId}/mqdefault.jpg`}
                    alt=""
                    width={52} height={52}
                    style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{rec.title}</p>
                    <p className="truncate" style={{ fontSize: 12, color: '#B3B3B3', marginTop: 2 }}>{rec.artist || rec.channelTitle}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); playSong(rec); setShowSuggestions(false); }}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <FiPlay size={14} style={{ fill: 'currentcolor', marginLeft: 2 }} />
                  </button>
                </div>
              )) : (
                <p style={{ color: '#B3B3B3', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No suggestions yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
