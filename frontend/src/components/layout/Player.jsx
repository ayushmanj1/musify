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
  FiVolume2, FiShare2, FiMonitor,
} from 'react-icons/fi'

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
  } = usePlayer()

  const { currentTime, duration } = usePlayerTime()
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
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
        <div style={{
          position: 'fixed', inset: 0,
          zIndex: 100,
          display: 'flex', flexDirection: 'column',
          willChange: 'transform',
          animation: 'slideUp 350ms cubic-bezier(0.32,0.72,0,1)',
        }}>
          {/* ─── Blurred Album Background ─── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${thumb})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) brightness(0.35)',
            transform: 'scale(1.2)',
          }} />
          {/* Dark overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'rgba(0,0,0,0.45)',
          }} />

          {/* ─── Content ─── */}
          <div style={{
            position: 'relative', zIndex: 2,
            flex: 1, display: 'flex', flexDirection: 'column',
            maxWidth: 390, width: '100%', margin: '0 auto',
            padding: '0 24px',
          }}>
            {/* ─── Top Bar ─── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              height: 56,
            }}>
              <button
                onClick={() => setIsFullScreenPlayer(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fff', padding: 4, touchAction: 'manipulation',
                }}
              >
                <FiChevronDown size={28} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Playing from Liked Songs
              </span>
              <div style={{ width: 28 }} /> {/* spacer */}
            </div>

            {/* ─── Album Art ─── */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px 0',
            }}>
              <img
                src={thumb.replace('mqdefault', 'hqdefault')}
                alt={currentSong.title}
                width={300} height={300}
                style={{
                  width: '80vw', maxWidth: 300, height: 'auto', aspectRatio: '1',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
                }}
              />
            </div>

            {/* ─── Song Info ─── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="truncate" style={{ fontSize: 22, fontWeight: 700 }}>
                  {currentSong.title}
                </p>
                <p className="truncate" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {currentSong.artist}
                </p>
              </div>
              <button
                onClick={handleToggleSave}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                  color: saved ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                  animation: heartAnim ? 'heartPop 300ms ease' : 'none',
                  touchAction: 'manipulation', flexShrink: 0,
                }}
              >
                <FiHeart size={24} style={{ fill: saved ? 'currentcolor' : 'none' }} />
              </button>
            </div>

            {/* ─── Progress Bar ─── */}
            <div
              ref={progressRef}
              onTouchStart={(e) => {
                setIsSeeking(true)
                const t = handleProgressTouch(e, progressRef.current)
                if (t !== undefined) setSeekValue(t)
              }}
              onTouchMove={(e) => {
                if (isSeeking) {
                  const t = handleProgressTouch(e, progressRef.current)
                  if (t !== undefined) setSeekValue(t)
                }
              }}
              onTouchEnd={() => {
                if (isSeeking) { seekTo(seekValue); setIsSeeking(false) }
              }}
              onClick={(e) => {
                const t = handleProgressTouch(e, progressRef.current)
                if (t !== undefined) seekTo(t)
              }}
              style={{
                width: '100%', height: 20,
                display: 'flex', alignItems: 'center', cursor: 'pointer',
                touchAction: 'none',
              }}
            >
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' }}>
                <div style={{
                  width: `${isSeeking ? (seekValue / (duration || 1)) * 100 : progress}%`,
                  height: '100%', background: 'var(--accent)', borderRadius: 2,
                  transition: isSeeking ? 'none' : 'width 250ms linear',
                }} />
                {/* Thumb */}
                <div style={{
                  position: 'absolute',
                  top: '50%', left: `${isSeeking ? (seekValue / (duration || 1)) * 100 : progress}%`,
                  transform: `translate(-50%, -50%) scale(${isSeeking ? 1.5 : 1})`,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#fff',
                  transition: isSeeking ? 'none' : 'left 250ms linear, transform 150ms ease',
                }} />
              </div>
            </div>

            {/* Time stamps */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 20,
            }}>
              <span>{fmt(isSeeking ? seekValue : currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>

            {/* ─── Controls ─── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 32,
            }}>
              {/* Shuffle */}
              <button onClick={() => setShuffle(!shuffle)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                color: shuffle ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                touchAction: 'manipulation',
              }}>
                <FiShuffle size={20} />
              </button>

              {/* Previous */}
              <button onClick={playPrevious} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                color: '#fff', touchAction: 'manipulation',
              }}>
                <FiSkipBack size={22} style={{ fill: 'currentcolor' }} />
              </button>

              {/* Play/Pause — big circle */}
              <button
                onClick={togglePlay}
                style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000', border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  touchAction: 'manipulation',
                }}
              >
                {isAudioLoading ? <Spinner size={22} light={false} /> :
                  isPlaying ?
                    <FiPause size={26} style={{ fill: 'currentcolor' }} /> :
                    <FiPlay size={26} style={{ fill: 'currentcolor', marginLeft: 3 }} />}
              </button>

              {/* Next */}
              <button onClick={playNext} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                color: '#fff', touchAction: 'manipulation',
              }}>
                <FiSkipForward size={22} style={{ fill: 'currentcolor' }} />
              </button>

              {/* Repeat */}
              <button onClick={() => setRepeat(repeat === 'none' ? 'one' : 'none')} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                color: repeat !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                touchAction: 'manipulation',
              }}>
                <FiRepeat size={20} />
              </button>
            </div>

            {/* ─── Bottom Row: Copy Link + Share ─── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingBottom: 'max(24px, var(--safe-bottom))',
            }}>
              <button
                onClick={() => currentSong && copySongLink(currentSong)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                  color: 'rgba(255,255,255,0.5)', touchAction: 'manipulation',
                }}
              >
                <FiMonitor size={18} />
              </button>
              <button
                onClick={() => currentSong && shareSong(currentSong)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                  color: 'rgba(255,255,255,0.5)', touchAction: 'manipulation',
                }}
              >
                <FiShare2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
