import React, { useEffect, useState, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { 
  FiChevronDown, FiHeart, FiMoreHorizontal, 
  FiShuffle, FiSkipBack, FiPlay, FiPause, FiSkipForward, FiRepeat,
  FiVolume2, FiVolumeX, FiClock, FiMinimize2, FiSliders, FiList
} from 'react-icons/fi'
import toast from 'react-hot-toast'

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

const fakeLyrics = [
  "I'm walking in the neon lights",
  "Feeling like I own the nights",
  "Every step I take is bold",
  "Story that was never told",
  "We are young and we are free",
  "Nothing's gonna stop me",
  "Dancing till the sun comes up",
  "Drinking from a golden cup"
]

export default function FullScreenPlayer() {
  const { 
    isFullScreenPlayer, setIsFullScreenPlayer,
    currentSong, isPlaying, togglePlay,
    playNext, playPrevious, toggleSavedSong, isSongSaved,
    shuffle, setShuffle, repeat, setRepeat,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer
  } = usePlayer()

  const [visible, setVisible] = useState(isFullScreenPlayer)
  const [lyricsIdx, setLyricsIdx] = useState(0)
  
  const [isFlipped, setIsFlipped] = useState(false)
  const [hintSeen, setHintSeen] = useState(true)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1) // 0 to 1
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [isFsQueueOpen, setIsFsQueueOpen] = useState(false)

  const { recommendations, playSong } = usePlayer()

  useEffect(() => {
    setHintSeen(localStorage.getItem('lyricsHintSeen') === 'true')
  }, [])

  useEffect(() => {
    let interval;
    if (isFullScreenPlayer) {
      interval = setInterval(() => {
        const audio = document.querySelector('audio') || window.__musifyAudio
        if (audio) {
          setCurrentTime(audio.currentTime || 0)
          setDuration(audio.duration || 0)
          setVolume(audio.volume)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isFullScreenPlayer])

  useEffect(() => {
    if (isFullScreenPlayer) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [isFullScreenPlayer])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreenPlayer) setIsFullScreenPlayer(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullScreenPlayer])

  useEffect(() => {
    if (!isFullScreenPlayer || !isPlaying || !isFlipped) return
    const id = setInterval(() => {
      setLyricsIdx(prev => (prev + 1) % fakeLyrics.length)
    }, 4000)
    return () => clearInterval(id)
  }, [isFullScreenPlayer, isPlaying, isFlipped])

  const handleClose = () => setIsFullScreenPlayer(false)

  const handleSeek = (e) => {
    const audio = document.querySelector('audio') || window.__musifyAudio
    if (audio) audio.currentTime = Number(e.target.value)
  }

  const handleVolume = (e) => {
    const audio = document.querySelector('audio') || window.__musifyAudio
    if (audio) audio.volume = Number(e.target.value)
  }

  const openMenu = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: rect.left - 200, y: rect.bottom + 8, song: currentSong }
    }))
  }

  const openEq = (e) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('open-eq-modal'))
  }

  const toggleFsQueue = (e) => {
    e.stopPropagation()
    setIsFsQueueOpen(!isFsQueueOpen)
  }

  if (!visible || !currentSong) return null

  const saved = isSongSaved(currentSong.videoId)
  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`

  const getHue = (str) => {
    if (!str) return 260;
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash % 360);
  }
  const hue = getHue(currentSong.videoId)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', flexDirection: 'column',
      color: '#fff',
      transform: isFullScreenPlayer ? 'translateY(0)' : 'translateY(100%)',
      transition: isFullScreenPlayer ? 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.35s ease-in',
      overflow: 'hidden',
      background: '#121212'
    }}>
      
      {/* Dynamic Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -2,
        background: `radial-gradient(circle at 0% 0%, hsl(${hue}, 60%, 25%), transparent 70%), radial-gradient(circle at 100% 100%, hsl(${hue}, 80%, 10%), transparent 70%)`,
        transition: 'background 0.8s ease'
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'rgba(0,0,0,0.35)' }} />

      {/* Full Screen Queue Overlay */}
      {isFsQueueOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          background: 'rgba(15, 10, 25, 0.98)', 
          backdropFilter: 'blur(40px)',
          display: 'flex', flexDirection: 'column',
          animation: 'fsQueueIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', alignItems: 'center', padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button 
              onClick={() => setIsFsQueueOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FiChevronDown size={24} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 0 16px', color: '#fff' }}>Up Next</h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="hide-scrollbar">
            {recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.slice(0, 20).map((song, i) => (
                  <div 
                    key={song.videoId || i} 
                    onClick={() => { playSong(song, recommendations, i); setIsFsQueueOpen(false) }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '10px', 
                      borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s' 
                    }}
                    className="fs-queue-row-premium"
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: `hsl(${getHue(song.videoId)}, 40%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {song.thumbnail ? (
                        <img src={song.thumbnail} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '24px' }}>{song.emoji || '♪'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#fff' }} className="truncate">{song.title}</p>
                      <p style={{ margin: 0, color: '#b3b3b3', fontSize: '13px' }} className="truncate">{song.artist}</p>
                    </div>
                    <span style={{ color: '#b3b3b3', fontSize: '13px' }}>{song.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
                }}>
                  <FiList size={40} style={{ color: '#8B5CF6', opacity: 0.6 }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Suggestions are cooking...</h3>
                <p style={{ fontSize: '14px', color: '#b3b3b3', maxWidth: '240px', margin: 0, lineHeight: 1.5 }}>
                  We're finding the perfect songs to play next. Hang tight!
                </p>
                <button 
                  onClick={() => setIsFsQueueOpen(false)}
                  style={{ marginTop: '32px', background: '#8B5CF6', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '24px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back to Player
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px', width: '100%', flexShrink: 0
      }}>
        <button onClick={handleClose} style={{
          background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
          padding: '8px', fontSize: '22px', display: 'flex', alignItems: 'center'
        }}>
          <FiChevronDown />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: '#b3b3b3', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>PLAYING FROM</p>
          <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Musify Playlist</p>
        </div>

        <button onClick={openMenu} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <FiMoreHorizontal size={24} />
        </button>
      </div>

      {/* Main Content Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
        <div style={{ width: '100%', maxWidth: '480px', padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Flip Card */}
          <div 
            onClick={() => {
              setIsFlipped(!isFlipped)
              if (!hintSeen) {
                setHintSeen(true)
                localStorage.setItem('lyricsHintSeen', 'true')
              }
            }}
            style={{
              width: '300px', height: '300px', margin: '0 auto',
              position: 'relative', cursor: 'pointer', perspective: '1000px'
            }}
          >
            <div style={{
              width: '100%', height: '100%', position: 'absolute',
              transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
              transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'
            }}>
              {/* FRONT */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                borderRadius: '16px', overflow: 'hidden',
                animation: isPlaying && !isFlipped ? 'pulseGlow 2s infinite ease-in-out' : 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}>
                <img src={thumb} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={currentSong.title} />
              </div>
              
              {/* BACK (Lyrics) */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                borderRadius: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                transform: 'rotateY(180deg)', overflowY: 'auto', padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: fakeLyrics.length ? 'flex-start' : 'center'
              }} className="hide-scrollbar">
                {fakeLyrics.length > 0 ? fakeLyrics.map((l, i) => (
                  <p key={i} style={{
                    fontSize: i === lyricsIdx ? '18px' : '15px', 
                    fontWeight: i === lyricsIdx ? 'bold' : 'normal',
                    color: i === lyricsIdx ? '#fff' : '#b3b3b3',
                    opacity: i === lyricsIdx ? 1 : 0.5,
                    textAlign: 'center', margin: 0, transition: 'all 0.3s ease'
                  }}>{l}</p>
                )) : (
                  <div style={{ textAlign: 'center', color: '#b3b3b3' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎵</span>
                    <p style={{ fontSize: '15px', margin: 0 }}>No lyrics available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
            {!hintSeen && !isFlipped && <p style={{ fontSize: '11px', color: '#b3b3b3', margin: 0 }}>Tap for lyrics</p>}
            {isFlipped && <p style={{ fontSize: '11px', color: '#b3b3b3', margin: 0 }}>Tap to go back</p>}
          </div>

          {/* Song Info Row */}
          <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
              <p className="truncate" style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>{currentSong.title}</p>
              <p className="truncate" style={{ fontSize: '15px', color: '#b3b3b3', margin: 0 }}>{currentSong.artist}</p>
            </div>
            <button 
              onClick={() => toggleSavedSong(currentSong)} 
              className="heart-btn"
              style={{ background: 'none', border: 'none', color: saved ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer', padding: '4px' }}
            >
              <FiHeart size={24} style={{ fill: saved ? '#8B5CF6' : 'none' }} />
            </button>
          </div>

          {/* Seek Bar */}
          <div style={{ marginTop: '20px', width: '100%' }} className="fs-seek-container">
            <input 
              type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
              className="fs-seek-slider"
              style={{ 
                width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', outline: 'none',
                background: `linear-gradient(to right, #8B5CF6 ${(currentTime / (duration || 100)) * 100}%, #535353 ${(currentTime / (duration || 100)) * 100}%)`,
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#b3b3b3' }}>{fmt(currentTime)}</span>
              <span style={{ fontSize: '12px', color: '#b3b3b3' }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <button onClick={() => setShuffle(!shuffle)} style={{ background: 'none', border: 'none', color: shuffle ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer', position: 'relative' }}>
              <FiShuffle size={20} />
              {shuffle && <div style={{ width: 4, height: 4, background: '#8B5CF6', borderRadius: '50%', position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)' }} />}
            </button>
            
            <button onClick={playPrevious} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <FiSkipBack size={24} />
            </button>
            
            <button onClick={togglePlay} className="fs-play-btn" style={{ 
              background: '#fff', border: 'none', borderRadius: '50%',
              width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.1s ease',
              boxShadow: isPlaying ? '0 4px 24px rgba(139,92,246,0.4)' : 'none'
            }}>
              {isPlaying ? <FiPause size={28} fill="#000" color="#000" /> : <FiPlay size={28} fill="#000" color="#000" style={{ marginLeft: 4 }} />}
            </button>
            
            <button onClick={playNext} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <FiSkipForward size={24} />
            </button>
            
            <button onClick={() => setRepeat(repeat === 'none' ? 'context' : 'none')} style={{ background: 'none', border: 'none', color: repeat !== 'none' ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer', position: 'relative' }}>
              <FiRepeat size={20} />
              {repeat !== 'none' && <div style={{ width: 4, height: 4, background: '#8B5CF6', borderRadius: '50%', position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)' }} />}
            </button>
          </div>

          {/* Volume + Extra Row */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <button onClick={() => setVolume(volume === 0 ? 1 : 0)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              {volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <input 
              type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume}
              className="fs-seek-slider"
              style={{ 
                flex: 1, height: '4px', borderRadius: '2px', appearance: 'none', outline: 'none',
                background: `linear-gradient(to right, #8B5CF6 ${volume * 100}%, #535353 ${volume * 100}%)`,
                cursor: 'pointer'
              }}
            />
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsSleepTimerOpen(!isSleepTimerOpen)}
                style={{ background: 'none', border: 'none', color: sleepTimer.active ? '#8B5CF6' : '#fff', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <FiClock size={20} />
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
                  position: 'absolute', bottom: '40px', right: '0px', background: '#242424',
                  borderRadius: '12px', padding: '16px', width: '220px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.7)', border: '1px solid #3a3a3a',
                  zIndex: 300, animation: 'fadeIn 0.2s ease', cursor: 'default'
                }}>
                  {sleepTimer.active ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>Timer Active</p>
                      <p style={{ color: '#b3b3b3', fontSize: '12px', textAlign: 'center', margin: 0 }}>
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
                        <input type="number" min="1" max="120" placeholder="1-120" id="fs-custom-timer-input" style={{
                          background: '#1a1a1a', border: '1px solid #535353', color: '#fff', padding: '4px',
                          borderRadius: '4px', width: '60px', fontSize: '12px', outline: 'none'
                        }} />
                        <button onClick={() => {
                          const val = document.getElementById('fs-custom-timer-input').value
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
          </div>

          {/* Bottom Area */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <button className="fs-bottom-btn" onClick={openEq} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <FiSliders size={18} />
            </button>
            <button className="fs-bottom-btn" onClick={toggleFsQueue} style={{ background: 'none', border: 'none', color: isFsQueueOpen ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <FiList size={18} />
            </button>
            <button className="fs-bottom-btn" onClick={handleClose} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <FiMinimize2 size={18} />
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 30px rgba(139,92,246,0.3); }
          50% { box-shadow: 0 0 80px rgba(139,92,246,0.5); }
          100% { box-shadow: 0 0 30px rgba(139,92,246,0.3); }
        }
        @keyframes fsQueueIn {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fs-queue-row-premium:hover {
          background: rgba(255,255,255,0.08);
        }
        .heart-btn {
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .heart-btn:active {
          transform: scale(1.3);
        }
        .fs-play-btn:hover {
          transform: scale(1.05);
        }
        .fs-bottom-btn {
          transition: all 0.2s ease;
        }
        .fs-bottom-btn:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.1) !important;
        }
        
        .fs-queue-row:hover {
          background: rgba(255,255,255,0.1);
        }
        
        /* Range slider styling */
        .fs-seek-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .fs-seek-slider:hover::-webkit-slider-thumb,
        .fs-seek-slider:active::-webkit-slider-thumb {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
