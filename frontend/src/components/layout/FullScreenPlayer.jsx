import React, { useEffect, useState, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { 
  FiChevronDown, FiHeart, FiMoreHorizontal, 
  FiShuffle, FiSkipBack, FiPlay, FiPause, FiSkipForward, FiRepeat,
  FiVolume2, FiVolumeX, FiClock, FiMinimize2, FiSliders, FiList, FiX
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getLyrics } from '../../utils/api.js'

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function parseLRC(lrcContent) {
  if (!lrcContent) return []
  const lines = lrcContent.split('\n')
  const result = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  lines.forEach(line => {
    const match = timeRegex.exec(line)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3])
      const time = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100)
      const text = line.replace(timeRegex, '').trim()
      if (text) result.push({ time, text })
    }
  })
  return result.sort((a, b) => a.time - b.time)
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
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#fff' }} className="truncate">{song.title}</p>
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

export default function FullScreenPlayer() {
  const { 
    isFullScreenPlayer, setIsFullScreenPlayer,
    currentSong, isPlaying, togglePlay,
    playNext, playPrevious, toggleSavedSong, isSongSaved,
    shuffle, setShuffle, repeat, setRepeat,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    recommendations, playSong, queue, queueIndex
  } = usePlayer()

  const [visible, setVisible] = useState(isFullScreenPlayer)
  const [lyricsData, setLyricsData] = useState({ plain: [], synced: [] })
  const [isLyricsLoading, setIsLyricsLoading] = useState(false)
  const [lyricsIdx, setLyricsIdx] = useState(-1)
  const [isFlipped, setIsFlipped] = useState(false)
  const [hintSeen, setHintSeen] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFsQueueOpen, setIsFsQueueOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const lyricsContainerRef = useRef(null)

  useEffect(() => {
    setHintSeen(localStorage.getItem('lyricsHintSeen') === 'true')
  }, [])

  // Fetch Real Lyrics with Sync Support
  useEffect(() => {
    if (!currentSong) return
    const fetchLyrics = async () => {
      setIsLyricsLoading(true)
      const data = await getLyrics(currentSong.videoId, currentSong.artist, currentSong.title)
      if (data) {
        const synced = parseLRC(data.syncedLyrics)
        const plain = data.plainLyrics ? data.plainLyrics.split('\n').filter(l => l.trim() !== '') : []
        setLyricsData({ plain, synced })
      } else {
        setLyricsData({ plain: [], synced: [] })
      }
      setLyricsIdx(-1)
      setIsLyricsLoading(false)
    }
    fetchLyrics()
  }, [currentSong?.videoId])

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
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isFullScreenPlayer])

  useEffect(() => {
    if (isFullScreenPlayer) setVisible(true)
    else {
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [isFullScreenPlayer])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFsQueueOpen) setIsFsQueueOpen(false)
        else if (isFullScreenPlayer) setIsFullScreenPlayer(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullScreenPlayer, isFsQueueOpen])

  // Sync lyrics with time
  useEffect(() => {
    if (!isFullScreenPlayer || !isPlaying || !isFlipped) return
    
    if (lyricsData.synced.length > 0) {
      let index = -1
      for (let i = 0; i < lyricsData.synced.length; i++) {
        if (currentTime >= lyricsData.synced[i].time) index = i
        else break
      }
      if (index !== lyricsIdx) {
        setLyricsIdx(index)
        const activeLine = document.getElementById(`lyric-line-${index}`)
        if (activeLine && lyricsContainerRef.current) {
          activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } else if (lyricsData.plain.length > 0) {
      const lineDuration = duration / lyricsData.plain.length
      const currentLineIdx = Math.floor(currentTime / lineDuration)
      if (currentLineIdx !== lyricsIdx) setLyricsIdx(currentLineIdx)
    }
  }, [currentTime, duration, lyricsData, isFlipped, isPlaying, isFullScreenPlayer])

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

  if (!visible && !isFullScreenPlayer) return null
  if (!currentSong) return null

  const getHue = (str) => {
    if (!str) return 260;
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash % 360);
  }

  const hue = getHue(currentSong.videoId)
  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`
  const saved = isSongSaved(currentSong.videoId)
  const activeLyrics = lyricsData.synced.length > 0 ? lyricsData.synced : lyricsData.plain.map(text => ({ text }))

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
      
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -2,
        background: `radial-gradient(circle at 0% 0%, hsl(${hue}, 60%, 25%), transparent 70%), radial-gradient(circle at 100% 100%, hsl(${hue}, 80%, 10%), transparent 70%)`,
        transition: 'background 0.8s ease'
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'rgba(0,0,0,0.35)' }} />

      {/* Suggestions Panel */}
      <div style={{
        position: 'absolute', top: '64px', right: '16px',
        width: 'min(340px, 90vw)', height: 'calc(100% - 80px)',
        background: 'rgba(32,32,32,0.85)', backdropFilter: 'blur(24px)',
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', zIndex: 10001,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        transform: isFsQueueOpen ? 'translateX(0)' : 'translateX(120%)',
        opacity: isFsQueueOpen ? 1 : 0, pointerEvents: isFsQueueOpen ? 'auto' : 'none', overflow: 'hidden'
      }}>
        <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Up Next</span>
          <button onClick={() => setIsFsQueueOpen(false)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}><FiX size={24} /></button>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('queue')} style={{ background: activeTab === 'queue' ? '#fff' : 'transparent', color: activeTab === 'queue' ? '#000' : '#b3b3b3', borderRadius: '24px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: activeTab === 'queue' ? 'none' : '1px solid #535353', cursor: 'pointer' }}>Queue</button>
          <button onClick={() => setActiveTab('suggestions')} style={{ background: activeTab === 'suggestions' ? '#fff' : 'transparent', color: activeTab === 'suggestions' ? '#000' : '#b3b3b3', borderRadius: '24px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: activeTab === 'suggestions' ? 'none' : '1px solid #535353', cursor: 'pointer' }}>Suggestions</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
          {activeTab === 'queue' ? (
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: '10px', color: '#b3b3b3', letterSpacing: '1px', padding: '8px 20px 4px', margin: 0 }}>NOW PLAYING</p>
              <SongRow song={currentSong} isPlaying={isPlaying} isCurrent={true} />
              <p style={{ fontSize: '10px', color: '#b3b3b3', letterSpacing: '1px', padding: '16px 20px 4px', margin: 0 }}>NEXT UP</p>
              {queue.slice(queueIndex + 1, queueIndex + 7).map((s, i) => <SongRow key={s.videoId || i} song={s} onClick={() => playSong(s)} />)}
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: '10px', color: '#b3b3b3', letterSpacing: '1px', padding: '8px 20px 4px', margin: 0 }}>SUGGESTED FOR YOU</p>
              {recommendations.slice(0, 8).map((s, i) => <SongRow key={s.videoId || i} song={s} showAdd={true} onClick={() => playSong(s)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', flexShrink: 0 }}>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}><FiChevronDown size={24}/></button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: 0 }}>PLAYING FROM</p>
          <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Premium Player</p>
        </div>
        <button onClick={openMenu} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}><FiMoreHorizontal size={24} /></button>
      </div>

      {/* Main Container - Ensuring Bottom Icons are visible */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 20px 24px', overflow: 'hidden' }}>
        
        {/* Album Art / Lyrics Row */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <div 
            onClick={() => {
              setIsFlipped(!isFlipped)
              if (!hintSeen) { setHintSeen(true); localStorage.setItem('lyricsHintSeen', 'true'); }
            }}
            style={{ width: 'min(300px, 75vw)', aspectRatio: '1/1', position: 'relative', cursor: 'pointer', perspective: '1200px' }}
          >
            <div style={{
              width: '100%', height: '100%', position: 'absolute', transformStyle: 'preserve-3d', 
              transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)', transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'
            }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '20px', overflow: 'hidden', animation: isPlaying && !isFlipped ? 'pulseGlow 3s infinite ease-in-out' : 'none', boxShadow: '0 12px 48px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={thumb} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" />
              </div>
              <div 
                ref={lyricsContainerRef}
                style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  borderRadius: '24px', 
                  background: `linear-gradient(45deg, #FF3366, #33CCFF, #FFD700, #8B5CF6)`,
                  backgroundSize: '400% 400%',
                  animation: 'vibrantGradient 15s ease infinite',
                  backdropFilter: 'blur(10px)',
                  transform: 'rotateY(180deg)', overflowY: 'auto', padding: '40px 24px',
                  display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
                  boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }} className="hide-scrollbar"
              >
                {isLyricsLoading ? (
                  <div style={{ textAlign: 'center', color: '#b3b3b3', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="lyrics-loader" />
                    <p style={{ marginTop: '16px', fontSize: '13px', fontWeight: 600 }}>SYNCING...</p>
                  </div>
                ) : activeLyrics.length > 0 ? (
                  activeLyrics.map((l, i) => (
                    <p key={i} id={`lyric-line-${i}`} style={{
                      fontSize: i === lyricsIdx ? '20px' : '16px', fontWeight: i === lyricsIdx ? '800' : '600',
                      color: i === lyricsIdx ? '#fff' : 'rgba(255,255,255,0.3)', textAlign: 'center', margin: 0, 
                      transition: 'all 0.4s ease', fontFamily: "'Outfit', sans-serif", lineHeight: '1.4',
                      filter: i === lyricsIdx ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none'
                    }}>{l.text}</p>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#b3b3b3', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎻</span>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>No lyrics</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info & Controls - These will stay visible */}
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={toggleFsQueue} style={{ background: 'none', border: 'none', color: isFsQueueOpen ? '#8B5CF6' : '#fff', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <FiList size={22} />
            </button>
            <button onClick={() => toggleSavedSong(currentSong)} style={{ background: 'none', border: 'none', color: saved ? '#8B5CF6' : '#fff', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <FiHeart size={22} style={{ fill: saved ? '#8B5CF6' : 'none', opacity: saved ? 1 : 0.4 }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="truncate" style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 2px 0' }}>{currentSong.title}</h1>
              <p className="truncate" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>{currentSong.artist}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="fs-seek-slider" style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', outline: 'none', background: `linear-gradient(to right, #fff ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.15) ${(currentTime / (duration || 100)) * 100}%)`, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{fmt(currentTime)}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{fmt(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <button onClick={() => setShuffle(!shuffle)} style={{ background: 'none', border: 'none', color: shuffle ? '#8B5CF6' : '#fff', opacity: shuffle ? 1 : 0.4, cursor: 'pointer' }}><FiShuffle size={20} /></button>
            <button onClick={playPrevious} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiSkipBack size={26} /></button>
            <button onClick={togglePlay} style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{isPlaying ? <FiPause size={28} color="#000" /> : <FiPlay size={28} color="#000" style={{ marginLeft: 4 }} />}</button>
            <button onClick={playNext} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiSkipForward size={26} /></button>
            <button onClick={() => setRepeat(repeat === 'none' ? 'context' : 'none')} style={{ background: 'none', border: 'none', color: repeat !== 'none' ? '#8B5CF6' : '#fff', opacity: repeat !== 'none' ? 1 : 0.4, cursor: 'pointer' }}><FiRepeat size={20} /></button>
          </div>


        </div>
      </div>

      <style>{`
        .fs-bottom-btn { background: none; border: none; color: #fff; cursor: pointer; transition: all 0.2s; padding: 8px; }
        .fs-bottom-btn:hover { transform: scale(1.15); opacity: 1 !important; }
        @keyframes eqBar { from { height: 4px; } to { height: 14px; } }
        .eq-bar { width: 3px; border-radius: 2px; background: #8B5CF6; animation: eqBar 0.6s ease-in-out infinite alternate; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 30px rgba(139,92,246,0.2); } 50% { box-shadow: 0 0 80px rgba(139,92,246,0.3); } 100% { box-shadow: 0 0 30px rgba(139,92,246,0.2); } }
        .fs-seek-slider::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; }
        @keyframes lyricsSpin { to { transform: rotate(360deg); } }
        .lyrics-loader { width: 28px; height: 28px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: lyricsSpin 0.8s linear infinite; }
        
        @keyframes vibrantGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
