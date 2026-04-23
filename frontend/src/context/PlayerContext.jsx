import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

const PlayerContext = createContext(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
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
      return JSON.parse(localStorage.getItem('recentlyPlayed') || '[]')
    } catch { return [] }
  })
  const [playlists, setPlaylists] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('playlists') || '[]')
    } catch { return [] }
  })
  const [savedSongs, setSavedSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedSongs') || '[]')
    } catch { return [] }
  })

  const playerRef = useRef(null)
  const playerReady = useRef(false)
  const timeUpdateInterval = useRef(null)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed))
  }, [recentlyPlayed])

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists))
  }, [playlists])

  useEffect(() => {
    localStorage.setItem('savedSongs', JSON.stringify(savedSongs))
  }, [savedSongs])

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer()
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      createPlayer()
    }

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
          playerReady.current = true
          playerRef.current.setVolume(volume)
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            playNext()
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
        onError: () => {
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

  const playSong = useCallback((song, songQueue = null, index = 0) => {
    if (!song) return
    setCurrentSong(song)

    if (songQueue) {
      setQueue(songQueue)
      setQueueIndex(index)
    }

    // Add to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.videoId !== song.videoId)
      return [song, ...filtered].slice(0, 30)
    })

    if (playerReady.current && playerRef.current) {
      playerRef.current.loadVideoById(song.videoId)
      playerRef.current.setVolume(volume)
    }
  }, [volume])

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

  // Playlist management
  const createPlaylist = useCallback((name) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: new Date().toISOString(),
    }
    setPlaylists(prev => [...prev, newPlaylist])
    toast.success(`Created playlist "${name}"`)
    return newPlaylist
  }, [])

  const addToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        if (pl.songs.some(s => s.videoId === song.videoId)) {
          toast.error('Song already in playlist')
          return pl
        }
        toast.success(`Added to "${pl.name}"`)
        return { ...pl, songs: [...pl.songs, song] }
      }
      return pl
    }))
  }, [])

  const removeFromPlaylist = useCallback((playlistId, videoId) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songs: pl.songs.filter(s => s.videoId !== videoId) }
      }
      return pl
    }))
    toast.success('Removed from playlist')
  }, [])

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId))
    toast.success('Playlist deleted')
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

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [songToAdd, setSongToAdd] = useState(null)

  const value = {
    currentSong, isPlaying, currentTime, duration, volume, queue, queueIndex,
    recentlyPlayed, playlists, savedSongs,
    isSidebarExpanded, setIsSidebarExpanded,
    isRightPanelOpen, setIsRightPanelOpen,
    songToAdd, setSongToAdd,
    playSong, togglePlay, seekTo, setPlayerVolume, playNext, playPrevious, addToQueue,
    createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist,
    toggleSavedSong, isSongSaved,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div id="yt-player" style={{ position: 'fixed', top: -9999, left: -9999, width: 0, height: 0, pointerEvents: 'none', opacity: 0 }} />
    </PlayerContext.Provider>
  )
}
