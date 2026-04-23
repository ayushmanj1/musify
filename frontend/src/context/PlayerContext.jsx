import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getRecommendations } from '../utils/api.js'

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
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('searchHistory') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })
  
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
  const [repeat, setRepeat] = useState('none') // 'none', 'one', 'all'
  const [isGuestMode, setIsGuestMode] = useState(() => {
    return localStorage.getItem('isGuestMode') === 'true'
  })
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  const playerRef = useRef(null)
  const playerReady = useRef(false)
  const timeUpdateInterval = useRef(null)
  const silentAudioRef = useRef(new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAHAA'))
  silentAudioRef.current.loop = true

  // Refs for state to avoid stale closures in event listeners
  const queueRef = useRef([])
  const queueIndexRef = useRef(-1)
  const recommendationsRef = useRef([])
  const shuffleRef = useRef(false)
  const repeatRef = useRef('none')

  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { recommendationsRef.current = recommendations }, [recommendations])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { repeatRef.current = repeat }, [repeat])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed))
  }, [recentlyPlayed])



  useEffect(() => {
    localStorage.setItem('savedSongs', JSON.stringify(savedSongs))
  }, [savedSongs])

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
  }, [searchHistory])

  useEffect(() => {
    localStorage.setItem('isGuestMode', isGuestMode)
  }, [isGuestMode])

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      toast.error('App is already installed or not supported')
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      toast.success('Installing Musify...')
    }
  }

  // Media Session API (Lock Screen Controls)
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || currentSong.channelTitle,
        album: 'Musify Premium',
        artwork: [
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        haptics.light()
        togglePlay()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        haptics.light()
        togglePlay()
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        haptics.medium()
        playPrevious()
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        haptics.medium()
        playNext()
      })
      
      // Update position state
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: currentTime
        })
      }
    }
  }, [currentSong, duration, currentTime])

  // Handle Playback State Changes (Background Sync)
  useEffect(() => {
    if (isPlaying) {
      silentAudioRef.current.play().catch(() => {})
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    } else {
      silentAudioRef.current.pause()
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    }
  }, [isPlaying])

  // Initialize YouTube IFrame API
  useEffect(() => {
    const initYT = () => {
      if (window.YT && window.YT.Player) {
        createPlayer()
      } else {
        window.onYouTubeIframeAPIReady = createPlayer
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          document.body.appendChild(tag)
        }
      }
    }

    initYT()

    return () => {
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current)
    }
  }, [])



  function createPlayer() {
    playerRef.current = new window.YT.Player('yt-player', {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: () => {
          console.log('[Player] YouTube Player Ready')
          playerReady.current = true
          playerRef.current.setVolume(volume)
        },
        onStateChange: (event) => {
          const states = {
            '-1': 'UNSTARTED',
            '0': 'ENDED',
            '1': 'PLAYING',
            '2': 'PAUSED',
            '3': 'BUFFERING',
            '5': 'CUED'
          }
          console.log(`[Player] State Change: ${states[event.data] || event.data}`)

          if (event.data === window.YT.PlayerState.ENDED) {
            console.log('[Player] Song Ended. Checking for next track...')
            
            // 0. Check Repeat One
            if (repeatRef.current === 'one') {
              console.log('[Player] Repeat One enabled. Replaying...')
              playerRef.current.seekTo(0)
              playerRef.current.playVideo()
              return
            }

            // 1. Check Shuffle (Suggestion Mode)
            if (shuffleRef.current && recommendationsRef.current.length > 0) {
              console.log('[Player] Shuffle/Suggestion Mode: Playing from Smart Suggestions')
              const nextSong = recommendationsRef.current[0]
              setRecommendations(prev => prev.slice(1))
              playSong(nextSong)
              return
            }

            // 2. Check manual queue
            const nextInQueue = queueIndexRef.current + 1
            if (nextInQueue < queueRef.current.length) {
              console.log('[Player] Playing next from manual queue')
              playNext()
            } 
            // 3. Autoplay suggestions (fallback)
            else if (recommendationsRef.current.length > 0) {
              console.log('[Player] Autoplay: Playing from Smart Suggestions')
              const nextSong = recommendationsRef.current[0]
              setRecommendations(prev => prev.slice(1))
              playSong(nextSong)
            } else {
              console.log('[Player] No queue or suggestions. Retrying in 2s...')
              setTimeout(() => {
                if (recommendationsRef.current.length > 0) {
                  const nextSong = recommendationsRef.current[0]
                  setRecommendations(prev => prev.slice(1))
                  playSong(nextSong)
                } else {
                  console.log('[Player] Still no suggestions. Stopping.')
                  setIsPlaying(false)
                }
              }, 2000)
            }
          }
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
            setDuration(playerRef.current.getDuration())
            startTimeTracking()
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
            stopTimeTracking()
          }
        },
        onError: (err) => {
          console.error('[Player] Error:', err.data)
          toast.error('Playback error. Skipping...')
          setTimeout(() => playNext(), 1500)
        }
      }
    })
  }

  function startTimeTracking() {
    stopTimeTracking()
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime())
        setDuration(playerRef.current.getDuration())
      }
    }, 500)
  }

  function stopTimeTracking() {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
      timeUpdateInterval.current = null
    }
  }

  const fadeInterval = useRef(null)

  const fadeVolume = useCallback((targetVol, duration = 1500) => {
    return new Promise((resolve) => {
      if (fadeInterval.current) clearInterval(fadeInterval.current)
      
      const startVol = playerRef.current?.getVolume() || volume
      const steps = 20
      const stepTime = duration / steps
      const volStep = (targetVol - startVol) / steps
      let currentStep = 0

      fadeInterval.current = setInterval(() => {
        currentStep++
        const newVol = startVol + (volStep * currentStep)
        if (playerRef.current && playerReady.current) {
          playerRef.current.setVolume(newVol)
        }
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval.current)
          fadeInterval.current = null
          resolve()
        }
      }, stepTime)
    })
  }, [volume])

  const fetchRecommendations = useCallback(async (song) => {
    if (!song) return
    console.log(`[Context] Fetching recs for: ${song.title}`)
    setIsRecLoading(true)
    const recs = await getRecommendations(song.videoId, song.artist, song.title)
    console.log(`[Context] Received ${recs.length} recommendations`)
    setRecommendations(recs)
    setIsRecLoading(false)
  }, [])

  // Auto-fetch recommendations when song changes
  useEffect(() => {
    if (currentSong) {
      fetchRecommendations(currentSong)
    }
  }, [currentSong, fetchRecommendations])

  // Periodically update progress in history
  useEffect(() => {
    if (currentSong && isPlaying && duration > 0) {
      const interval = setInterval(() => {
        const time = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        setRecentlyPlayed(prev => {
          if (prev.length === 0) return prev
          return prev.map(s => 
            s.videoId === currentSong.videoId 
              ? { ...s, lastProgress: (time / duration) * 100 } 
              : s
          )
        })
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentSong, isPlaying, duration])

  const playSong = useCallback(async (song, songQueue = null, index = 0) => {
    if (!song) return
    console.log(`[Context] playSong called for: ${song.title} (${song.videoId})`)

    // Ultra-Smooth Crossfade: Fade Out (~1500ms)
    if (currentSong && isPlaying) {
      await fadeVolume(0, 1500)
    }

    setCurrentSong(song)
    fetchRecommendations(song)

    if (songQueue) {
      setQueue(songQueue)
      setQueueIndex(index)
    }

    // Add to recently played (History)
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.videoId !== song.videoId)
      const songWithTimestamp = { 
        ...song, 
        playedAt: new Date().toISOString(),
        lastProgress: 0 
      }
      return [songWithTimestamp, ...filtered].slice(0, 100)
    })

    if (playerReady.current && playerRef.current) {
      playerRef.current.loadVideoById(song.videoId)
      // Ultra-Smooth Crossfade: Fade In (~1200ms)
      playerRef.current.setVolume(0)
      setTimeout(() => fadeVolume(volume, 1200), 200)
    }
  }, [volume, currentSong, isPlaying, fadeVolume, fetchRecommendations])

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !playerReady.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const seekTo = useCallback((time) => {
    if (playerRef.current && playerReady.current) {
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
    }
  }, [])

  const setPlayerVolume = useCallback((vol) => {
    setVolume(vol)
    if (playerRef.current && playerReady.current) {
      playerRef.current.setVolume(vol)
    }
  }, [])

  const playNext = useCallback(() => {
    if (queue.length === 0) return
    const nextIndex = queueIndex + 1
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex)
      playSong(queue[nextIndex], queue, nextIndex)
    }
  }, [queue, queueIndex, playSong])

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return
    const prevIndex = queueIndex - 1
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex)
      playSong(queue[prevIndex], queue, prevIndex)
    }
  }, [queue, queueIndex, playSong])

  const addToQueue = useCallback((song) => {
    setQueue(prev => [...prev, song])
    toast.success(`Added "${song.title}" to queue`)
  }, [])



  // Saved songs
  const toggleSavedSong = useCallback((song) => {
    setSavedSongs(prev => {
      const exists = prev.some(s => s.videoId === song.videoId)
      if (exists) {
        toast.success('Removed from library')
        return prev.filter(s => s.videoId !== song.videoId)
      } else {
        toast.success('Saved to library')
        return [song, ...prev]
      }
    })
  }, [])

  const isSongSaved = useCallback((videoId) => {
    return savedSongs.some(s => s.videoId === videoId)
  }, [savedSongs])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault()
        playNext()
      }
      if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault()
        playPrevious()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, playNext, playPrevious])

  const removeFromHistory = useCallback((videoId, playedAt) => {
    setRecentlyPlayed(prev => prev.filter(s => !(s.videoId === videoId && s.playedAt === playedAt)))
  }, [])

  const addSearchToHistory = useCallback((query) => {
    if (!query || !query.trim()) return
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase())
      return [query.trim(), ...filtered].slice(0, 4)
    })
  }, [])

  const removeSearchFromHistory = useCallback((query) => {
    setSearchHistory(prev => prev.filter(q => q !== query))
  }, [])

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const timeValue = useMemo(() => ({
    currentTime,
    duration
  }), [currentTime, duration])

  const value = useMemo(() => ({
    currentSong, isPlaying, volume, queue, queueIndex,
    recentlyPlayed, savedSongs, searchHistory,
    recommendations, isRecLoading, installApp,
    deferredPrompt,
    isSuggestionsOpen,
    setIsSuggestionsOpen,
    isSidebarExpanded, setIsSidebarExpanded,
    isFullScreenPlayer, setIsFullScreenPlayer,
    isSearchOpen, setIsSearchOpen,
    playSong, togglePlay, seekTo, setPlayerVolume, playNext, playPrevious, addToQueue,
    toggleSavedSong, isSongSaved, removeFromHistory,
    addSearchToHistory, removeSearchFromHistory,
    shuffle, setShuffle, repeat, setRepeat,
    isGuestMode, setIsGuestMode,
  }), [
    currentSong, isPlaying, volume, queue, queueIndex,
    recentlyPlayed, savedSongs, searchHistory,
    recommendations, isRecLoading, isSuggestionsOpen,
    isSidebarExpanded,
    isFullScreenPlayer,
    isSearchOpen,
    playSong, togglePlay, seekTo, setPlayerVolume, playNext, playPrevious, addToQueue,
    toggleSavedSong, isSongSaved, removeFromHistory,
    addSearchToHistory, removeSearchFromHistory,
    shuffle, repeat, isGuestMode
  ])

  return (
    <PlayerTimeContext.Provider value={timeValue}>
      <PlayerContext.Provider value={value}>
        {children}
        <div id="yt-player" style={{ position: 'fixed', top: -9999, left: -9999, width: 0, height: 0, pointerEvents: 'none', opacity: 0 }} />
      </PlayerContext.Provider>
    </PlayerTimeContext.Provider>
  )
}
