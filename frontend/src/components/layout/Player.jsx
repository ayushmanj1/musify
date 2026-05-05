import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiHeart, FiShuffle, FiRepeat,
  FiVolume2, FiVolumeX, FiList, FiMonitor, FiClock, FiMessageSquare
} from 'react-icons/fi'
import LyricsShareCard from '../ui/LyricsShareCard.jsx'
import { getLyrics } from '../../utils/api.js'

/* ─── Time Formatter ─── */
function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/* ─── Progress Hook ─── */
function usePlayerTime() {
  const { currentSong } = usePlayer()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
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

export default function Player() {
  const {
    currentSong, isPlaying, togglePlay,
    seekTo, playNext, playPrevious, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    toggleSavedSong, isSongSaved, isAudioLoading,
    recommendations, 
    setVolume, volume,
    isRightSidebarOpen, setIsRightSidebarOpen,
    isFullScreenPlayer, setIsFullScreenPlayer,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer
  } = usePlayer()

  const { currentTime, duration } = usePlayerTime()
  const [localVolume, setLocalVolume] = useState(1) // 0 to 1
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [lyrics, setLyrics] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const queueRef = useRef(null)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set global audio volume
  useEffect(() => {
    const audio = document.querySelector('audio') || window.__musifyAudio
    if (audio) audio.volume = localVolume
  }, [localVolume])

  // Close queue on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (queueRef.current && !queueRef.current.contains(e.target)) {
        setIsQueueOpen(false)
      }
    }
    if (isQueueOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isQueueOpen])

  // Fetch lyrics for current song
  useEffect(() => {
    if (!currentSong) return
    const fetchLyrics = async () => {
      try {
        const data = await getLyrics(currentSong.videoId, currentSong.artist, currentSong.title)
        if (data && data.plainLyrics) {
          // Split by newline and filter empty
          const lines = data.plainLyrics.split('\n').filter(l => l.trim().length > 0).map(text => ({ text }))
          setLyrics(lines)
        } else if (data && data.syncedLyrics) {
          // Simple regex to remove [mm:ss.xx]
          const lines = data.syncedLyrics.split('\n')
            .map(l => l.replace(/\[\d+:\d+\.\d+\]/g, '').trim())
            .filter(l => l.length > 0)
            .map(text => ({ text }))
          setLyrics(lines)
        } else {
          setLyrics([])
        }
      } catch (err) {
        setLyrics([])
      }
    }
    fetchLyrics()
  }, [currentSong])

  if (!currentSong) return null

  const saved = currentSong ? isSongSaved(currentSong.videoId) : false
  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/mqdefault.jpg`
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  if (isMobile) {
    return (
      <div 
        onClick={() => setIsFullScreenPlayer(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--mobile-nav-h) + 12px + var(--safe-bottom, 0px))',
          left: '12px',
          right: '12px',
          height: 'var(--mobile-player-h)',
          background: 'rgba(24, 24, 24, 0.8)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '12px',
          zIndex: 1100,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="truncate" style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
            {currentSong.title}
          </p>
          <p className="truncate" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0 0', fontWeight: 500 }}>
            {currentSong.artist}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Share Lyrics Trigger */}
          <div onClick={(e) => e.stopPropagation()} style={{ marginRight: '4px' }}>
            <LyricsShareCard song={currentSong} lyrics={lyrics} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleSavedSong(currentSong) }}
            style={{ background: 'none', border: 'none', color: saved ? 'var(--accent)' : '#fff', padding: '10px', cursor: 'pointer', opacity: saved ? 1 : 0.6 }}
          >
            <FiHeart size={20} style={{ fill: saved ? 'currentcolor' : 'none' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            style={{ background: 'none', border: 'none', color: '#fff', padding: '10px', cursor: 'pointer' }}
          >
            {isPlaying ? <FiPause size={28} /> : <FiPlay size={28} />}
          </button>
        </div>

        {/* Progress bar line at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: '12px', right: '12px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s linear' }} />
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="bottom-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative',
      zIndex: 9999
    }}>
      {/* ─── LEFT: Track Info (30%) ─── */}
      <div 
        onClick={() => setIsFullScreenPlayer(true)}
        style={{ flex: '0 1 30%', minWidth: 0, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
      >
        <img
          src={thumb}
          alt=""
          width={56} height={56}
          style={{ borderRadius: '4px', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <p className="truncate" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {currentSong.title}
          </p>
          <p className="truncate" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentSong.artist}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSavedSong(currentSong) }}
          style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: saved ? 'var(--accent)' : 'var(--text-secondary)',
            marginLeft: '8px'
          }}
        >
          <FiHeart size={16} style={{ fill: saved ? 'currentcolor' : 'none' }} />
        </button>
        
        {/* Lyrics Share Trigger */}
        <div style={{ marginLeft: '12px' }} onClick={(e) => e.stopPropagation()}>
          <LyricsShareCard song={currentSong} lyrics={lyrics} />
        </div>
      </div>

      {/* ─── CENTER: Controls & Progress (40%) ─── */}
      <div style={{ flex: '0 1 40%', maxWidth: '722px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => setShuffle(!shuffle)}
            style={{ background: 'none', border: 'none', color: shuffle ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <FiShuffle size={16} />
            {shuffle && <div style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', margin: '4px auto 0' }} />}
          </button>
          
          <button onClick={playPrevious} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <FiSkipBack size={20} style={{ fill: 'currentcolor' }} />
          </button>
          
          <button
            onClick={togglePlay}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#fff',
              color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none'
            }}
          >
            {isPlaying ? <FiPause size={16} style={{ fill: 'currentcolor' }} /> : <FiPlay size={16} style={{ fill: 'currentcolor', marginLeft: '2px' }} />}
          </button>

          <button onClick={playNext} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <FiSkipForward size={20} style={{ fill: 'currentcolor' }} />
          </button>

          <button
            onClick={() => setRepeat(repeat === 'none' ? 'one' : 'none')}
            style={{ background: 'none', border: 'none', color: repeat !== 'none' ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <FiRepeat size={16} />
            {repeat !== 'none' && <div style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', margin: '4px auto 0' }} />}
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '32px', textAlign: 'right' }}>
            {fmt(currentTime)}
          </span>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="spotify-slider"
              style={{ position: 'absolute', zIndex: 2, width: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
            </div>
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="spotify-slider"
              style={{
                position: 'absolute', zIndex: 3, width: '100%',
                background: `linear-gradient(to right, var(--accent) ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '32px' }}>
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* ─── RIGHT: Volume & Extras (30%) ─── */}
      <div style={{ flex: '0 1 30%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsSleepTimerOpen(!isSleepTimerOpen)}
            style={{ 
              background: 'none', border: 'none', 
              color: sleepTimer.active ? '#8B5CF6' : 'var(--text-secondary)',
              position: 'relative'
            }}
          >
            <FiClock size={16} />
            {sleepTimer.active && sleepTimerRemaining > 0 && (
              <span style={{ 
                position: 'absolute', top: '-8px', right: '-12px', background: '#8B5CF6', 
                color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '8px' 
              }}>
                {Math.ceil(sleepTimerRemaining / 60000)}m
              </span>
            )}
          </button>
          
          {isSleepTimerOpen && (
            <div style={{
              position: 'absolute', bottom: '40px', right: '-110px', background: '#242424',
              borderRadius: '12px', padding: '16px', width: '220px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)', border: '1px solid #3a3a3a',
              zIndex: 300, animation: 'timerFadeIn 0.2s ease', cursor: 'default'
            }}>
              {sleepTimer.active ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Timer Active</p>
                  <p style={{ color: '#b3b3b3', fontSize: '12px', textAlign: 'center' }}>
                    {sleepTimer.stopAfterCurrent ? 'Ends after current song' : `Ends in ${Math.ceil(sleepTimerRemaining / 60000)} minutes`}
                  </p>
                  <button 
                    onClick={() => { cancelSleepTimer(); setIsSleepTimerOpen(false) }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel Timer
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Sleep Timer</h4>
                    <p style={{ color: '#b3b3b3', fontSize: '12px', margin: '4px 0 0 0' }}>Stop playing after:</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[5, 10, 15, 30, 45, 60].map(m => (
                      <button key={m} onClick={() => { startSleepTimer(m); setIsSleepTimerOpen(false) }} style={{
                        background: '#333', border: 'none', color: '#fff', padding: '8px 0',
                        borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s'
                      }} onMouseEnter={e=>e.currentTarget.style.background='#8B5CF6'} onMouseLeave={e=>e.currentTarget.style.background='#333'}>
                        {m} min
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #3a3a3a', paddingTop: '12px' }}>
                    <span style={{ color: '#fff', fontSize: '12px', width: '50px' }}>Custom:</span>
                    <input type="number" min="1" max="120" placeholder="1-120" id="custom-timer-input" style={{
                      background: '#1a1a1a', border: '1px solid #535353', color: '#fff', padding: '4px',
                      borderRadius: '4px', width: '60px', fontSize: '12px', outline: 'none'
                    }} />
                    <button onClick={() => {
                      const val = document.getElementById('custom-timer-input').value
                      if (val && !isNaN(val) && val > 0 && val <= 120) {
                        startSleepTimer(Number(val)); setIsSleepTimerOpen(false)
                      }
                    }} style={{ background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Set</button>
                  </div>

                  <button onClick={() => { startSleepTimer('endOfSong'); setIsSleepTimerOpen(false) }} style={{
                    background: '#333', border: 'none', color: '#fff', padding: '8px',
                    borderRadius: '8px', fontSize: '13px', cursor: 'pointer', width: '100%', transition: 'background 0.2s'
                  }} onMouseEnter={e=>e.currentTarget.style.background='#8B5CF6'} onMouseLeave={e=>e.currentTarget.style.background='#333'}>
                    End of song
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
          <FiMonitor size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
          <button
            onClick={() => setLocalVolume(localVolume === 0 ? 1 : 0)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
          >
            {localVolume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={localVolume}
            onChange={(e) => setLocalVolume(Number(e.target.value))}
            className="spotify-slider"
            style={{ flex: 1, background: `linear-gradient(to right, var(--text-primary) ${localVolume * 100}%, rgba(255,255,255,0.3) ${localVolume * 100}%)` }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes timerFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
