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

function SongRow({ song, isPlaying, isCurrent, showAdd, onClick }) {
  const { addToQueue } = usePlayer()
  const [added, setAdded] = useState(false)

  if (!song) return null

  const hue = ((song.title?.charCodeAt(0) || 0) * 37) % 360;
  const bg = song.color || `hsl(${hue}, 35%, 25%)`
  const initial = song.title?.charAt(0).toUpperCase()

  const handleAdd = (e) => {
    e.stopPropagation()
    if (added) return
    addToQueue(song)
    setAdded(true)
    toast.success('Added to queue', { position: 'bottom-center' })
  }

  return (
    <div 
      onClick={onClick}
      className={`premium-song-row ${isCurrent ? 'active' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px',
        margin: '0 8px', borderRadius: '8px', cursor: 'pointer',
        background: isCurrent ? 'rgba(139,92,246,0.1)' : 'transparent',
        borderLeft: isCurrent ? '3px solid #8B5CF6' : '3px solid transparent',
        transition: 'background 0.2s ease'
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }} className="song-poster">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : song.emoji ? (
          <span style={{ fontSize: '20px', lineHeight: '44px' }}>{song.emoji}</span>
        ) : (
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{initial}</span>
        )}
        
        {isCurrent && (
          <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
            <div className="eq-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <div className="eq-bar" style={{ animationDelay: '150ms', animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <div className="eq-bar" style={{ animationDelay: '300ms', animationPlayState: isPlaying ? 'running' : 'paused' }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: isCurrent ? '#A78BFA' : '#fff' }} className="truncate">{song.title}</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#b3b3b3' }} className="truncate">{song.artist}</p>
      </div>

      <span style={{ fontSize: '12px', color: '#b3b3b3', opacity: 0.7, flexShrink: 0 }} className="row-duration">{fmt(song.duration)}</span>
      
      <div style={{ flexShrink: 0, width: 24, display: 'flex', justifyContent: 'flex-end' }}>
        {showAdd ? (
          <button onClick={handleAdd} style={{
            width: 20, height: 20, borderRadius: '50%', border: added ? '1px solid #8B5CF6' : '1px solid #535353',
            background: 'none', color: added ? '#8B5CF6' : '#b3b3b3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }} className="add-btn">
            {added ? '✓' : '+'}
          </button>
        ) : (
          <FiMoreHorizontal size={14} color="#b3b3b3" className="row-dots" />
        )}
      </div>
    </div>
  )
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
                </div>


                {/* Up Next Section */}
                <div className="up-next-section" style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: '16px 0',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', padding: '0 20px' }}>Up Next</h4>
                  
                  {/* Currently Playing */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#b3b3b3', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '20px', letterSpacing: '1px' }}>Now Playing</p>
                    <SongRow song={currentSong} isPlaying={isPlaying} isCurrent={true} onClick={() => {}} />
                  </div>

                  {/* Next Queue Items */}
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#b3b3b3', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '20px', letterSpacing: '1px' }}>Next Up</p>
                  {upNextList.map((song, i) => (
                    <SongRow key={song.videoId || i} song={song} onClick={() => playSong(song)} />
                  ))}
                  {repeat !== 'context' && upNextList.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', marginTop: '16px' }}>End of queue</p>
                  )}

                  {/* Queue Suggestions */}
                  <div style={{ marginTop: '24px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#b3b3b3', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '20px', letterSpacing: '1px' }}>Suggested For You</p>
                    {suggestions.map((song, i) => (
                      <SongRow key={song.videoId || i} song={song} showAdd={true} onClick={() => playSong(song)} />
                    ))}
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
        
        .premium-song-row:hover { background: rgba(255,255,255,0.06) !important; }
        .premium-song-row:hover .song-poster { filter: brightness(1.1); }
        .premium-song-row:hover .row-duration, 
        .premium-song-row:hover .row-dots { opacity: 1 !important; }
        .premium-song-row:hover .add-btn { border-color: #fff !important; color: #fff !important; }

        @keyframes eqBar {
          from { height: 4px; }
          to { height: 14px; }
        }
        .eq-bar {
          width: 3px; border-radius: 2px; background: #8B5CF6;
          animation: eqBar 0.6s ease-in-out infinite alternate;
        }

        @keyframes eq {
          0% { height: 2px; }
          50% { height: 10px; }
          100% { height: 2px; }
        }
      `}</style>
    </div>
  )
}
