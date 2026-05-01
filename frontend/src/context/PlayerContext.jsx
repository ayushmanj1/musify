/**
 * MUSIFY v2.0 — PlayerContext
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Switched from YouTube IFrame API to HTML <audio> with /api/stream
 * - Removed playlist feature entirely
 * - Removed history/recentlyPlayed tracking
 * - Removed searchHistory tracking
 * - Removed Clerk/guest mode dependency
 * - Kept: savedSongs (liked), queue, recommendations, shuffle, repeat
 * - Simplified crossfade to a quick volume ramp
 * - Media Session API for lock screen controls
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getRecommendations } from '../utils/api.js'
import { crossfadeManager } from '../utils/crossfade.js'

const PlayerContext = createContext(null)
const PlayerTimeContext = createContext(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}

export function usePlayerTime() {
  const context = useContext(PlayerTimeContext)
  if (!context) throw new Error('usePlayerTime must be used within PlayerProvider')
  return context
}

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)

  const [savedSongs, setSavedSongs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedSongs') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })

  const [recommendations, setRecommendations] = useState([])
  const [isRecLoading, setIsRecLoading] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none')
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  // Crossfade state
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crossfadeEnabled') || 'true') } catch { return true }
  })
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crossfadeDuration') || '6') } catch { return 6 }
  })

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState({
    active: false,
    endTime: null,
    stopAfterCurrent: false
  })
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null)

  // HTML Audio element — also exposed globally for time polling
  const audioRef = useRef(new Audio())
  if (typeof window !== 'undefined') window.__musifyAudio = audioRef.current
  const timeUpdateRef = useRef(null)
  
  // Invisible preloader
  const preloaderRef = useRef(new Audio())

  // Refs to avoid stale closures
  const queueRef = useRef([])
  const queueIndexRef = useRef(-1)
  const recommendationsRef = useRef([])
  const shuffleRef = useRef(false)
  const repeatRef = useRef('none')
  const sleepTimerRef = useRef(sleepTimer)
  const playNextRef = useRef(null)
  const playSongRef = useRef(null)
  const volumeRef = useRef(volume)
  const retryCountRef = useRef(0)

  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { recommendationsRef.current = recommendations }, [recommendations])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { repeatRef.current = repeat }, [repeat])
  useEffect(() => { sleepTimerRef.current = sleepTimer }, [sleepTimer])
  useEffect(() => { volumeRef.current = volume }, [volume])

  // Persist saved songs and settings
  useEffect(() => {
    localStorage.setItem('savedSongs', JSON.stringify(savedSongs))
  }, [savedSongs])

  useEffect(() => {
    localStorage.setItem('crossfadeEnabled', JSON.stringify(crossfadeEnabled))
    crossfadeManager.setEnabled(crossfadeEnabled)
  }, [crossfadeEnabled])

  useEffect(() => {
    localStorage.setItem('crossfadeDuration', JSON.stringify(crossfadeDuration))
    crossfadeManager.setDuration(crossfadeDuration)
  }, [crossfadeDuration])

  // ─── Audio Element Setup ───
  useEffect(() => {
    const audio = audioRef.current
    crossfadeManager.init(audio)
    
    audio.volume = volume / 100
    audio.preload = 'auto'

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // Crossfade logic
      const hasNext = (queueIndexRef.current + 1 < queueRef.current.length) || (recommendationsRef.current.length > 0)
      
      const triggerNext = () => {
        if (queueIndexRef.current + 1 < queueRef.current.length) {
          if (playNextRef.current) playNextRef.current(true) // Pass true for isAutoCrossfade
        } else if (recommendationsRef.current.length > 0) {
          const nextSong = recommendationsRef.current[0]
          setRecommendations(prev => prev.slice(1))
          if (playSongRef.current) playSongRef.current(nextSong, null, 0, true) // Pass true
        }
      }

      crossfadeManager.checkCrossfade(
        audio.currentTime,
        audio.duration || 0,
        volumeRef.current / 100,
        hasNext,
        triggerNext
      )
    }

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }

    const onPlaying = () => {
      console.log('[Audio] Playing started')
      setIsPlaying(true)
      setIsAudioLoading(false)
    }

    const onWaiting = () => {
      console.log('[Audio] Buffering...')
      setIsAudioLoading(true)
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    const onEnded = () => {
      // Sleep Timer: End of track
      if (sleepTimerRef.current.active && sleepTimerRef.current.stopAfterCurrent) {
        setIsPlaying(false)
        setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
        return
      }

      // Repeat one
      if (repeatRef.current === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }

      // Shuffle: play from recommendations
      if (shuffleRef.current && recommendationsRef.current.length > 0) {
        const nextSong = recommendationsRef.current[0]
        setRecommendations(prev => prev.slice(1))
        if (playSongRef.current) playSongRef.current(nextSong)
        return
      }

      // Next in queue
      const nextIdx = queueIndexRef.current + 1
      if (nextIdx < queueRef.current.length) {
        if (playNextRef.current) playNextRef.current()
        return
      }

      // Autoplay from recommendations
      if (recommendationsRef.current.length > 0) {
        const nextSong = recommendationsRef.current[0]
        setRecommendations(prev => prev.slice(1))
        if (playSongRef.current) playSongRef.current(nextSong)
      } else {
        setIsPlaying(false)
      }
    }

    const onError = () => {
      console.error('[Audio] Playback error', audio.error)
      if (retryCountRef.current < 2) {
        retryCountRef.current++
        console.log(`[Audio] Retrying... (${retryCountRef.current}/2)`)
        try {
          const url = new URL(audio.src, window.location.origin)
          url.searchParams.set('retry', Date.now())
          audio.oncanplay = null
          audio.src = url.toString()
          audio.load()
          audio.oncanplay = () => {
            audio.oncanplay = null
            audio.play().catch(() => {})
          }
        } catch(e) {
          console.error('Retry failed', e)
        }
      } else {
        toast.error('Playback error. Skipping...')
        retryCountRef.current = 0
        setTimeout(() => {
          if (playNextRef.current) playNextRef.current()
        }, 1500)
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  // Update volume on audio element
  useEffect(() => {
    audioRef.current.volume = volume / 100
  }, [volume])

  // ─── Sleep Timer Interval ───
  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.stopAfterCurrent) return

    const interval = setInterval(() => {
      if (!sleepTimer.endTime) return
      
      const remaining = sleepTimer.endTime - Date.now()
      if (remaining <= 0) {
        audioRef.current.pause()
        setIsPlaying(false)
        setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
        setSleepTimerRemaining(null)
      } else {
        setSleepTimerRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sleepTimer])

  // ─── Media Session API ───
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || currentSong.channelTitle,
        album: 'Musify',
        artwork: [
          { src: currentSong.thumbnail, sizes: '320x180', type: 'image/jpeg' }
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => togglePlay())
      navigator.mediaSession.setActionHandler('pause', () => togglePlay())
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext())

      if (duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: Math.min(currentTime, duration)
          })
        } catch (e) { /* ignore */ }
      }
    }
  }, [currentSong, duration, currentTime])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // ─── Fetch Recommendations ───
  const fetchRecommendations = useCallback(async (song) => {
    if (!song) return
    setIsRecLoading(true)
    try {
      const recs = await getRecommendations(song.videoId, song.artist, song.title)
      setRecommendations(recs)
    } catch (e) {
      console.error('Recs error:', e)
    }
    setIsRecLoading(false)
  }, [])

  useEffect(() => {
    if (currentSong) fetchRecommendations(currentSong)
  }, [currentSong, fetchRecommendations])

  // ─── Play Song ───
  const playSong = useCallback((song, songQueue = null, index = 0, isAutoCrossfade = false) => {
    if (!song) return
    const audio = audioRef.current

    // Cancel any ongoing crossfade when manually playing a song
    if (!isAutoCrossfade) {
      crossfadeManager.cancelCrossfade(volumeRef.current / 100)
    }

    setCurrentSong(song)
    setCurrentTime(0)
    setDuration(0)
    setIsAudioLoading(true)
    setIsPlaying(true)
    retryCountRef.current = 0 // Reset retries on new song

    if (songQueue) {
      setQueue(songQueue)
      setQueueIndex(index)
    }

    // Set source to stream endpoint
    console.log(`[Audio] Loading: ${song.title}`)
    
    // Remove any previous canplay listener to prevent duplicates
    audio.oncanplay = null
    
    audio.src = `/api/stream?id=${song.videoId}`
    audio.load()
    
    // Wait for buffer to be ready before playing (fixes mobile)
    audio.oncanplay = () => {
      audio.oncanplay = null // Fire only once
      console.log('[Audio] Buffer ready, playing...')
      audio.play().catch(err => {
        console.warn('[Audio] Play failed:', err.message)
        setIsPlaying(false)
        setIsAudioLoading(false)
      })
    }
    
    // Fallback: if canplay doesn't fire within 8s, try playing anyway
    setTimeout(() => {
      if (audio.paused && audio.src && audio.readyState < 3) {
        console.log('[Audio] Fallback play attempt')
        audio.play().catch(() => {})
      }
    }, 8000)
  }, [])

  // ─── Preload Next Track ───
  useEffect(() => {
    const preloader = preloaderRef.current
    preloader.preload = 'auto'
    preloader.volume = 0
    
    let nextSongId = null
    if (queue.length > 0 && queueIndex + 1 < queue.length) {
      nextSongId = queue[queueIndex + 1].videoId
    } else if (recommendations.length > 0) {
      nextSongId = recommendations[0].videoId
    }

    if (nextSongId) {
      console.log(`[Audio] Preloading next track ID: ${nextSongId}`)
      preloader.src = `/api/stream?id=${nextSongId}`
      preloader.load()
    }
  }, [queue, queueIndex, recommendations])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio.src) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [isPlaying])

  const seekTo = useCallback((time) => {
    const audio = audioRef.current
    audio.currentTime = time
    setCurrentTime(time)
    
    // Always force play when seeking to fix the skip bug
    if (audio.src) {
      audio.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [])

  const setPlayerVolume = useCallback((vol) => {
    setVolume(vol)
    audioRef.current.volume = vol / 100
  }, [])

  const playNext = useCallback((isAutoCrossfade = false) => {
    if (queue.length === 0) return
    const nextIndex = queueIndex + 1
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex)
      playSong(queue[nextIndex], queue, nextIndex, isAutoCrossfade)
    }
  }, [queue, queueIndex, playSong])

  useEffect(() => { playNextRef.current = playNext }, [playNext])
  useEffect(() => { playSongRef.current = playSong }, [playSong])

  const playPrevious = useCallback((isAutoCrossfade = false) => {
    if (queue.length === 0) return
    const prevIndex = queueIndex - 1
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex)
      playSong(queue[prevIndex], queue, prevIndex, isAutoCrossfade)
    }
  }, [queue, queueIndex, playSong])

  const addToQueue = useCallback((song) => {
    setQueue(prev => [...prev, song])
    toast.success(`Added to queue`)
  }, [])

  // ─── Sleep Timer Actions ───
  const startSleepTimer = useCallback((minutes) => {
    if (minutes === 'track') {
      setSleepTimer({ active: true, endTime: null, stopAfterCurrent: true })
      setSleepTimerRemaining(null)
      toast.success('Timer set for end of track')
    } else {
      const endTime = Date.now() + minutes * 60000
      setSleepTimer({ active: true, endTime, stopAfterCurrent: false })
      setSleepTimerRemaining(minutes * 60000)
      toast.success(`Timer set for ${minutes} minutes`)
    }
  }, [])

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
    setSleepTimerRemaining(null)
    toast.success('Timer cancelled')
  }, [])

  // ─── Saved (Liked) Songs ───
  const toggleSavedSong = useCallback((song) => {
    setSavedSongs(prev => {
      const exists = prev.some(s => s.videoId === song.videoId)
      if (exists) {
        toast.success('Removed from liked')
        return prev.filter(s => s.videoId !== song.videoId)
      } else {
        toast.success('Added to liked')
        return [song, ...prev]
      }
    })
  }, [])

  const isSongSaved = useCallback((videoId) => {
    return savedSongs.some(s => s.videoId === videoId)
  }, [savedSongs])

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight' && e.ctrlKey) { e.preventDefault(); playNext() }
      if (e.code === 'ArrowLeft' && e.ctrlKey) { e.preventDefault(); playPrevious() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, playNext, playPrevious])

  const timeValue = useMemo(() => ({
    currentTime,
    duration
  }), [currentTime, duration])

  const value = useMemo(() => ({
    currentSong, isPlaying, volume, queue, queueIndex,
    savedSongs, recommendations, isRecLoading,
    isSuggestionsOpen, setIsSuggestionsOpen,
    isFullScreenPlayer, setIsFullScreenPlayer,
    isSearchOpen, setIsSearchOpen, isAudioLoading,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    crossfadeEnabled, setCrossfadeEnabled,
    crossfadeDuration, setCrossfadeDuration,
    playSong, togglePlay, seekTo, setPlayerVolume,
    playNext, playPrevious, addToQueue,
    toggleSavedSong, isSongSaved,
    shuffle, setShuffle, repeat, setRepeat,
  }), [
    currentSong, isPlaying, volume, queue, queueIndex,
    savedSongs, recommendations, isRecLoading, isSuggestionsOpen,
    isFullScreenPlayer, isSearchOpen, isAudioLoading,
    playSong, togglePlay, seekTo, setPlayerVolume,
    playNext, playPrevious, addToQueue,
    toggleSavedSong, isSongSaved,
    shuffle, repeat
  ])

  return (
    <PlayerTimeContext.Provider value={timeValue}>
      <PlayerContext.Provider value={value}>
        {children}
      </PlayerContext.Provider>
    </PlayerTimeContext.Provider>
  )
}
