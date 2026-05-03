import React, { useEffect, useState, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { 
  FiX, FiMoreHorizontal, FiHeart, FiPlay, FiPause, 
  FiSkipBack, FiSkipForward, FiRepeat, FiShuffle, FiClock
} from 'react-icons/fi'
import toast from 'react-hot-toast'

/* Fake suggested songs generator */
function getFakeSuggestions() {
  return [
    { videoId: 'sug1', title: 'Midnight City', artist: 'M83', duration: 243, thumbnail: 'https://i.ytimg.com/vi/dX3k_LSd3YY/mqdefault.jpg' },
    { videoId: 'sug2', title: 'Starboy', artist: 'The Weeknd', duration: 230, thumbnail: 'https://i.ytimg.com/vi/34Na4j8HLjc/mqdefault.jpg' },
    { videoId: 'sug3', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
    { videoId: 'sug4', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/mqdefault.jpg' }
  ]
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function RightSidebar() {
  const { 
    currentSong, isRightSidebarOpen, setIsRightSidebarOpen, queue, queueIndex,
    isPlaying, togglePlay, playNext, playPrevious, toggleSavedSong, isSongSaved, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer
  } = usePlayer()
  
  // Local state to control the fade animation independent of the width transition
  const [contentVisible, setContentVisible] = useState(isRightSidebarOpen)
  const [suggestions, setSuggestions] = useState([])
  const sidebarScrollRef = useRef(null)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)

  // Local Time / Duration from <audio> directly
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let interval;
    if (isRightSidebarOpen) {
      interval = setInterval(() => {
        const audio = document.querySelector('audio') || window.__musifyAudio
        if (audio) {
          setCurrentTime(audio.currentTime || 0)
          setDuration(audio.duration || 0)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRightSidebarOpen])

  const handleSeek = (e) => {
    const audio = document.querySelector('audio') || window.__musifyAudio
    if (audio) audio.currentTime = Number(e.target.value)
  }

  const saved = currentSong ? isSongSaved(currentSong.videoId) : false

  useEffect(() => {
    setSuggestions(getFakeSuggestions())
  }, [])

  const handleClose = () => {
    setContentVisible(false) // Trigger fade out
    setTimeout(() => {
      setIsRightSidebarOpen(false) // Trigger width shrink after fade out
    }, 150)
  }

  const handleOpen = () => {
    setIsRightSidebarOpen(true) // Trigger width expand
    setTimeout(() => {
      setContentVisible(true)
    }, 400)
  }

  // Handle external toggle (from Player.jsx)
  useEffect(() => {
    if (isRightSidebarOpen) {
      const t = setTimeout(() => setContentVisible(true), 400)
      return () => clearTimeout(t)
    } else {
      setContentVisible(false)
    }
  }, [isRightSidebarOpen])

  useEffect(() => {
    const onExternalClose = () => handleClose()
    window.addEventListener('close-right-sidebar', onExternalClose)
    return () => window.removeEventListener('close-right-sidebar', onExternalClose)
  }, [])

  const openMenu = (e, song) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: rect.left, y: rect.bottom + 8, song }
    }))
  }

  const addToQueue = (song) => {
    window.dispatchEvent(new CustomEvent('add-to-queue', { detail: { song } }))
    toast('Added to queue')
  }

  // Next 5 songs
  const upNextList = []
  if (queue && queue.length > 0 && queueIndex >= 0) {
    for (let i = queueIndex + 1; i < Math.min(queue.length, queueIndex + 6); i++) {
      upNextList.push(queue[i])
    }
  }

  return (
    <div className="right-sidebar" style={{
      position: 'relative',
      height: '100%',
      background: !isRightSidebarOpen ? '#1e1e1e' : 'var(--bg-panel)',
      borderLeft: !isRightSidebarOpen ? '2px solid #8B5CF6' : 'none',
      transition: 'background 0.3s ease, border-left 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {!isRightSidebarOpen ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            onClick={handleOpen}
            style={{ 
              background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer',
              padding: '16px 8px', fontSize: '18px', fontWeight: 'bold'
            }}
          >
            ❯
          </button>
        </div>
      ) : (
        <div style={{
          opacity: contentVisible ? 1 : 0,
          transition: contentVisible ? 'opacity 0.2s ease' : 'opacity 0.15s ease',
          height: '100%', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Now Playing</h3>
            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
              <button onClick={(e) => openMenu(e, currentSong)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FiMoreHorizontal size={20} />
              </button>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div style={{ padding: '0 20px 20px', overflowY: 'auto' }} className="hide-scrollbar" ref={sidebarScrollRef}>
            {currentSong ? (
              <>
                <style>{`
                  @keyframes sidebarPulse {
                    0% { box-shadow: 0 0 15px rgba(139,92,246,0.2); }
                    50% { box-shadow: 0 0 30px rgba(139,92,246,0.35); }
                    100% { box-shadow: 0 0 15px rgba(139,92,246,0.2); }
                  }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <img
                    src={currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`}
                    alt={currentSong.title}
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      animation: isPlaying ? 'sidebarPulse 2s infinite' : 'none',
                      transition: 'box-shadow 0.3s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <button onClick={() => toggleSavedSong(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <FiHeart size={20} style={{ fill: saved ? '#8B5CF6' : 'none', color: saved ? '#8B5CF6' : '#b3b3b3' }} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0 8px' }}>
                    <h2 className="truncate" style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      {currentSong.title}
                    </h2>
                    <p className="truncate" style={{ color: '#b3b3b3', fontSize: '13px' }}>
                      {currentSong.artist}
                    </p>
                  </div>
                </div>

                {/* Seek Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '30px' }}>{fmt(currentTime)}</span>
                  <input 
                    type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
                    style={{ flex: 1, accentColor: '#8B5CF6', height: '4px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '30px', textAlign: 'right' }}>{fmt(duration)}</span>
                </div>

                {/* Main Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                  <button onClick={() => setShuffle(!shuffle)} style={{ background: 'none', border: 'none', color: shuffle ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer' }}>
                    <FiShuffle size={20} />
                  </button>
                  <button onClick={playPrevious} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='#b3b3b3'}>
                    <FiSkipBack size={20} />
                  </button>
                  <button onClick={togglePlay} style={{ 
                    background: '#fff', border: 'none', color: '#000', borderRadius: '50%',
                    width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'transform 0.1s ease'
                  }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                    {isPlaying ? <FiPause size={20} fill="#000" /> : <FiPlay size={20} fill="#000" style={{ marginLeft: 2 }} />}
                  </button>
                  <button onClick={playNext} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='#b3b3b3'}>
                    <FiSkipForward size={20} />
                  </button>
                  <button onClick={() => setRepeat(repeat === 'none' ? 'context' : 'none')} style={{ background: 'none', border: 'none', color: repeat !== 'none' ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer' }}>
                    <FiRepeat size={20} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setIsSleepTimerOpen(!isSleepTimerOpen)}
                      style={{ background: 'none', border: 'none', color: sleepTimer.active ? '#8B5CF6' : '#b3b3b3', cursor: 'pointer', position: 'relative' }}
                    >
                      <FiClock size={20} />
                      {sleepTimer.active && sleepTimerRemaining > 0 && (
                        <span style={{ 
                          position: 'absolute', top: '-6px', right: '-8px', background: '#8B5CF6', 
                          color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '8px' 
                        }}>
                          {Math.ceil(sleepTimerRemaining / 60000)}m
                        </span>
                      )}
                    </button>
                    
                    {isSleepTimerOpen && (
                      <div style={{
                        position: 'absolute', bottom: '30px', right: '-80px', background: '#242424',
                        borderRadius: '12px', padding: '16px', width: '220px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.7)', border: '1px solid #3a3a3a',
                        zIndex: 300, animation: 'fadeIn 0.2s ease', cursor: 'default'
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
                              <input type="number" min="1" max="120" placeholder="1-120" id="rs-custom-timer-input" style={{
                                background: '#1a1a1a', border: '1px solid #535353', color: '#fff', padding: '4px',
                                borderRadius: '4px', width: '60px', fontSize: '12px', outline: 'none'
                              }} />
                              <button onClick={() => {
                                const val = document.getElementById('rs-custom-timer-input').value
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


                {/* Up Next Section */}
                <div className="up-next-section" style={{
                  background: 'var(--bg-card)',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Up Next</h4>
                  
                  {/* Currently Playing */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>Now Playing</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0,
                        background: `hsl(${((currentSong.title?.charCodeAt(0) || 0) * 37) % 360}, 50%, 30%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        boxShadow: '0 0 10px rgba(139,92,246,0.5)'
                      }}>
                        <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                          {currentSong.emoji || currentSong.title?.charAt(0)}
                        </span>
                        
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '10px' }}>
                          <div style={{ width: '3px', background: '#8B5CF6', animation: isPlaying ? 'eq 1.2s ease-in-out infinite' : 'none' }}></div>
                          <div style={{ width: '3px', background: '#8B5CF6', animation: isPlaying ? 'eq 1s ease-in-out infinite' : 'none', animationDelay: '0.2s' }}></div>
                          <div style={{ width: '3px', background: '#8B5CF6', animation: isPlaying ? 'eq 1.4s ease-in-out infinite' : 'none', animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="truncate" style={{ fontSize: '13px', fontWeight: 'bold', color: '#A78BFA' }}>{currentSong.title}</p>
                        <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{currentSong.artist}</p>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0, textAlign: 'right' }}>{fmt(currentSong.duration || 210)}</span>
                    </div>
                  </div>

                  {/* Next Queue Items */}
                  {upNextList.map((song, i) => {
                    const actualIndex = queueIndex + 1 + i
                    const hue = ((song.title?.charCodeAt(0) || 0) * 37) % 360;
                    return (
                      <div 
                        key={actualIndex}
                        className="queue-row"
                        onClick={(e) => {
                          const el = e.currentTarget
                          el.style.background = '#8B5CF6'
                          setTimeout(() => {
                            el.style.background = ''
                            const finalQueue = [
                              ...queue.slice(0, queueIndex + 1),
                              ...queue.slice(queueIndex + 1).filter((_, idx) => idx !== i)
                            ]
                            playSong(song, finalQueue, queueIndex + 1)
                          }, 300)
                        }}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', 
                          padding: '8px', borderRadius: '4px', cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                      >
                        <div className="queue-art-card" style={{ 
                          width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0,
                          background: `hsl(${hue}, 50%, 30%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                          transition: 'filter 0.3s ease'
                        }}>
                          <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                            {song.emoji || song.title?.charAt(0)}
                          </span>
                          <div className="queue-play-overlay" style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                            borderRadius: '6px', display: 'none', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <FiPlay size={16} color="#fff" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="truncate" style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{song.title}</p>
                          <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{song.artist}</p>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0, textAlign: 'right' }}>{fmt(song.duration || 210)}</span>
                        
                        <div className="queue-three-dot" style={{ opacity: 0, transition: 'opacity 0.2s', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                          <FiMoreHorizontal size={14} color="#b3b3b3" />
                        </div>
                      </div>
                    )
                  })}
                  {repeat !== 'context' && upNextList.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', marginTop: '16px' }}>End of queue</p>
                  )}

                  {/* Queue Suggestions */}
                  <div style={{ marginTop: '24px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#b3b3b3', marginBottom: '12px' }}>Queue Suggestions</p>
                    {suggestions.map((song, i) => {
                      const hue = ((song.title?.charCodeAt(0) || 0) * 37) % 360;
                      return (
                        <div 
                          key={i} 
                          className="queue-row"
                          onClick={() => {
                            const newQueue = [...queue.slice(0, queueIndex + 1), song, ...queue.slice(queueIndex + 1)]
                            playSong(song, newQueue, queueIndex + 1)
                            toast(`Now playing: ${song.title}`)
                          }}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px', 
                            borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s ease' 
                          }}
                        >
                          <div className="queue-art-card" style={{ 
                            width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0,
                            background: `hsl(${hue}, 50%, 30%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            transition: 'filter 0.3s ease'
                          }}>
                            <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
                              {song.emoji || song.title?.charAt(0)}
                            </span>
                            <div className="queue-play-overlay" style={{
                              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                              borderRadius: '6px', display: 'none', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <FiPlay size={16} color="#fff" style={{ marginLeft: '2px' }} />
                            </div>
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="truncate" style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{song.title}</p>
                            <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{song.artist}</p>
                          </div>
                          
                          <div className="queue-three-dot" style={{ opacity: 0, transition: 'opacity 0.2s', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                            <button onClick={(e) => {
                              e.stopPropagation()
                              addToQueue(song)
                            }} style={{
                              background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px',
                              transition: 'color 0.2s ease, transform 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = '#b3b3b3'}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.8)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <span style={{ fontSize: '20px' }}>+</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '40px 0'
              }}>
                <p>No song playing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style>{`
        @media (max-width: 1024px) {
          .right-sidebar { display: none !important; }
        }
        .queue-row:hover { background: #282828 !important; border-radius: 8px !important; }
        .queue-row:hover .queue-art-card { filter: brightness(1.15) !important; }
        .queue-row:hover .queue-play-overlay { display: flex !important; }
        .queue-row:hover .queue-three-dot { opacity: 1 !important; }

        @keyframes eq {
          0% { height: 2px; }
          50% { height: 10px; }
          100% { height: 2px; }
        }
      `}</style>
    </div>
  )
}
