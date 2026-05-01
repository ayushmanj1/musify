/**
 * MUSIFY BACKEND v2.0
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Replaced yt-search with youtube-sr (faster, more stable)
 * - Added /stream endpoint using @distube/ytdl-core (pipes audio directly)
 * - LRU cache (100 entries) for stream URLs, 30min for search
 * - compression (gzip) middleware on all routes
 * - Soft rate limit on /stream only (60 req/min per IP)
 * - No rate limiting on search
 * - Auto-retry with exponential backoff (200ms, 400ms) on ytdl calls
 * - Keep-alive connections
 * - Geo-block / unavailable returns { error: "unavailable" }
 * - Never crashes on bad video ID
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import ytsr from 'youtube-sr'
const YouTube = ytsr.default || ytsr
import youtubedl from 'youtube-dl-exec'
import { LRUCache } from 'lru-cache'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───
app.use(compression())
app.use(cors())
app.use(express.json())

// ─── Caches ───
const streamCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 })
const searchCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 30 })

// ─── Stream Rate Limiter (60/min per IP) ───
const streamRateMap = new Map()

function checkStreamRate(ip) {
  const now = Date.now()
  const entry = streamRateMap.get(ip)
  if (!entry || now - entry.start > 60000) {
    streamRateMap.set(ip, { start: now, count: 1 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

// Cleanup stale rate entries every 5 min
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of streamRateMap) {
    if (now - entry.start > 60000) streamRateMap.delete(ip)
  }
}, 300000)

// ─── Retry Helper ───
async function withRetry(fn, retries = 2, baseDelay = 200) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)))
    }
  }
}

function formatDuration(durFormatted, durMs) {
  if (durFormatted) return durFormatted
  if (!durMs) return '0:00'
  const seconds = Math.floor(durMs / 1000)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function durationSeconds(durMs) {
  if (!durMs) return 0
  return Math.floor(durMs / 1000)
}

// ─── Search Helper (youtube-sr) ───
async function performSearch(query, limit = 20) {
  try {
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music')
      ? query
      : `${query} song`

    const videos = await withRetry(() => YouTube.search(musicQuery, { limit: limit + 10, type: 'video' }), 3, 300)

    const formattedResults = videos
      .filter(v => {
        const title = (v.title || '').toLowerCase()
        const dur = durationSeconds(v.duration)
        if (dur < 60) return false
        const blacklist = ['shorts', '#shorts', 'trailer', 'teaser', 'reaction', 'review', 'tutorial', 'vlog', 'gaming', 'unboxing']
        if (blacklist.some(word => title.includes(word))) return false
        return true
      })
      .slice(0, limit)
      .map(v => ({
        videoId: v.id,
        title: v.title,
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: formatDuration(v.durationFormatted, v.duration),
        views: v.views || 0,
        publishedAt: 'recently'
      }))

    // Pre-fetch streams for the top 2 results in the background
    const topVideos = formattedResults.slice(0, 2)
    topVideos.forEach(v => prefetchStream(v.videoId))

    return formattedResults
  } catch (err) {
    console.error('Search error:', err.message)
    return []
  }
}

// ─── Stream Prefetcher ───
// Fetches the stream URL in the background while user browses search results
function prefetchStream(videoId) {
  if (streamCache.has(videoId)) return
  
  // Set a temporary flag so we don't duplicate requests
  streamCache.set(videoId, 'loading')
  
  withRetry(() => youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
    dumpJson: true, 
    noWarnings: true, 
    format: 'bestaudio' 
  }), 1, 500)
    .then(info => {
      if (info && info.url) {
        streamCache.set(videoId, info.url)
      } else {
        streamCache.delete(videoId) // Failed, remove flag
      }
    })
    .catch(() => {
      streamCache.delete(videoId)
    })
}

// ─── Routes ───

// Search (no rate limiting)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })

    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const results = await performSearch(query)
    searchCache.set(cacheKey, results)
    res.json({ results })
  } catch (err) {
    console.error('Search route error:', err.message)
    res.json({ results: [] })
  }
})

// Trending
app.get('/api/trending', async (req, res) => {
  try {
    const cached = searchCache.get('trending')
    if (cached) return res.json({ results: cached })

    const results = await performSearch('trending music 2024 hits', 25)
    searchCache.set('trending', results)
    res.json({ results })
  } catch (err) {
    console.error('Trending error:', err.message)
    res.json({ results: [] })
  }
})

// Artist Songs
app.get('/api/artist/:id/songs', async (req, res) => {
  try {
    const artistId = req.params.id
    const cacheKey = `artist:${artistId.toLowerCase()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json(cached)

    const songs = await performSearch(`${artistId} top songs`, 30)
    const result = {
      artist: {
        id: artistId,
        name: artistId,
        image: songs[0]?.thumbnail || `https://picsum.photos/400/400?random=1`
      },
      songs
    }

    searchCache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    console.error('Artist error:', err.message)
    res.json({ artist: { id: req.params.id, name: req.params.id, image: '' }, songs: [] })
  }
})

// Recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' })

    const cacheKey = `rec:${videoId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const query = artist ? `${artist} similar songs` : `${title} remix mix`
    let results = await performSearch(query, 15)
    results = results.filter(v => v.videoId !== videoId)

    searchCache.set(cacheKey, results)
    res.json({ results })
  } catch (err) {
    console.error('Recommendations error:', err.message)
    res.json({ results: [] })
  }
})

// Charts
app.get('/api/charts/:id', async (req, res) => {
  try {
    const chartId = req.params.id
    const cacheKey = `chart:${chartId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json(cached)

    let query = chartId.replace(/_/g, ' ')
    if (chartId === 'top_hits') query = 'top hits 2024'

    const songs = await performSearch(query, 30)
    const result = {
      chart: {
        id: chartId,
        name: chartId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: 'Automatically updated from YouTube trends.'
      },
      songs
    }

    searchCache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    console.error('Charts error:', err.message)
    res.json({ chart: { id: req.params.id, name: req.params.id }, songs: [] })
  }
})

// ─── Stream Endpoint ───
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id
  if (!videoId) return res.status(400).json({ error: 'Missing video ID' })

  // Soft rate limit on stream
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  if (!checkStreamRate(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again shortly.' })
  }

  try {
    // Check cache for resolved stream info
    let streamUrl = streamCache.get(videoId)

    if (!streamUrl || streamUrl === 'loading') {
      const info = await withRetry(() => youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
        dumpJson: true, 
        noWarnings: true, 
        format: 'bestaudio' 
      }), 2, 500)
      
      if (!info || !info.url) {
        streamCache.delete(videoId)
        return res.status(404).json({ error: 'unavailable' })
      }
      streamUrl = info.url
      streamCache.set(videoId, streamUrl)
    }

    // Handle range requests for seeking
    const range = req.headers.range
    const fetchOptions = range ? { headers: { Range: range } } : {}
    
    const response = await fetch(streamUrl, fetchOptions)
    
    res.status(range ? 206 : 200)
    
    // Copy necessary headers
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range'))
    }
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'))
    }
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/webm')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Accept-Ranges', 'bytes')

    if (!response.body) {
      return res.status(500).json({ error: 'Empty stream from upstream' })
    }

    // Pump stream to client
    const reader = response.body.getReader()
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { res.end(); break }
          if (!res.writableEnded) res.write(Buffer.from(value))
        }
      } catch (e) { 
        if (!res.writableEnded) res.end() 
      }
    }
    pump()
    
  } catch (err) {
    console.error('Stream endpoint error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'unavailable' })
    }
  }
})

// ─── Serve static files ───
app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// ─── Start with keep-alive ───
const server = app.listen(PORT, () => {
  console.log(`🎵 Musify v2 running on port ${PORT}`)
})

server.keepAliveTimeout = 65000
server.headersTimeout = 66000
