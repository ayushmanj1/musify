/**
 * MUSIFY BACKEND v4.0 — yt-dlp & play-dl Edition
 * ─────────────────────────────────────────────
 * REWRITE:
 * - Removed youtubei.js entirely (No more "Innertube" logs)
 * - Uses yt-dlp (via youtube-dl-exec) as the primary stream extractor
 * - Uses play-dl for fast, reliable search & metadata
 * - Retains LRU cache for high performance
 * - Optimization: Direct stream proxying with custom headers to prevent 403s
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import play from 'play-dl'
import { LRUCache } from 'lru-cache'
import { Readable } from 'stream'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───
app.use(compression())
app.use(cors({
  origin: 'https://musify-self-sigma.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}))
app.use(express.json())

// ─── Caches ───
const streamCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 })       // 1 hour
const searchCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 30 })       // 30 min


// ─── Stealth Identity Mimicry ───
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
]

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}


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

// ─── Play-DL Initialization ───
async function initPlayDl() {
  try {
    console.log('✅ play-dl search engine initialized')
  } catch (err) {
    console.error('⚠️ play-dl init error:', err.message)
  }
}

// ─── Duration Helpers ───
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseDurationText(text) {
  // e.g. "3:45" or "1:02:30"
  if (!text) return 0
  const parts = text.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

// ─── Search Helper (play-dl) ───
async function performSearch(query, limit = 20) {
  try {
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music')
      ? query
      : `${query} song`

    const videos = await withRetry(() => play.search(musicQuery, { 
      limit: limit + 10,
      source: { youtube: 'video' }
    }), 3, 300)

    const formattedResults = videos
      .filter(v => {
        const title = (v.title || '').toLowerCase()
        if (v.durationInSec < 60) return false

        const blacklist = [
          'lyrics', 'lyric', 'karaoke', 'sing along', '4k', '8k', '1080p', '720p', 
          'hd video', 'full video', 'unplugged', 'acoustic', 'cover', 'remake', 
          'tribute', 'piano version', 'guitar version', 'instrumental', 'reaction', 
          'react', 'review', 'explained', 'behind the scenes', 'making of', 'bts', 
          'interview', 'teaser', 'trailer', 'lofi', 'reverbed', 'reverb', 'slowed'
        ]
        if (blacklist.some(word => title.includes(word))) return false
        return true
      })
      .map(v => {
        const title = (v.title || '').toLowerCase()
        const channelName = (v.channel?.name || '').toLowerCase()
        let score = 0

        if (channelName.includes('topic') || channelName.includes('vevo')) score = 10
        else if (title.includes('official') || title.includes('audio')) score = 8
        else score = 1

        return { ...v, _score: score }
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score
        return b.views - a.views
      })
      .slice(0, limit)
      .map(v => ({
        videoId: v.id,
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently'
      }))

    if (formattedResults.length > 0) {
      prefetchStream(formattedResults[0].videoId)
    }

    return formattedResults
  } catch (err) {
    console.error('Search error:', err.message)
    return []
  }
}

// ─── Stream URL Extractor (yt-dlp fallback) ───
import youtubedl from 'youtube-dl-exec'

async function getStreamUrl(videoId) {
  console.log(`[Stream] Extracting ${videoId} using yt-dlp...`)
  try {
    // Primary: yt-dlp — Extremely reliable for direct stream URLs
    const info = await withRetry(() => youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
      dumpJson: true, 
      noWarnings: true, 
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/',
      format: 'bestaudio/best',
      userAgent: getRandomUA()
    }), 2, 500)
    
    if (info && info.url) {
      console.log(`[Stream] ${videoId} extracted via yt-dlp`)
      // Map extensions to mime types
      const mimeMap = {
        'webm': 'audio/webm',
        'm4a': 'audio/mp4',
        'mp3': 'audio/mpeg',
        'opus': 'audio/ogg'
      }
      const mime = mimeMap[info.ext] || 'audio/webm'
      const size = info.filesize || info.filesize_approx || 0
      
      return { 
        url: info.url, 
        mime, 
        size, 
        client: 'YTDLP' 
      }
    }
  } catch (err) {
    console.error(`[Stream] yt-dlp failed for ${videoId}:`, err.message)
  }

  throw new Error('Streaming extraction failed. YouTube might be blocking requests.')
}

// ─── Stream Prefetcher ───
function prefetchStream(videoId) {
  if (streamCache.has(videoId)) return

  // Set a temporary flag so we don't duplicate requests
  streamCache.set(videoId, 'loading')

  getStreamUrl(videoId)
    .then(streamInfo => {
      streamCache.set(videoId, streamInfo)
    })
    .catch(() => {
      streamCache.delete(videoId) // Failed, remove flag
    })
}

// ─── Related Videos (Simplified for play-dl) ───
async function getRelatedVideos(videoId, limit = 15) {
  try {
    const info = await withRetry(() => play.video_info(`https://www.youtube.com/watch?v=${videoId}`), 2, 300)
    const related = info.related_videos || []

    if (related.length > 0) {
      return related.slice(0, limit).map(v => ({
        videoId: v.id,
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently'
      }))
    }
  } catch (err) {
    console.warn('Related videos error:', err.message)
  }
  return []
}

// ─── Routes ───
app.get('/', (req, res) => res.send('Musify API is Live! 🚀'))
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

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

    const results = await performSearch('trending music 2025 hits', 25)
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

// Recommendations — NOW using real YouTube "Up Next" data
app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' })

    const cacheKey = `rec:${videoId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    // Try real YouTube recommendations first
    let results = await getRelatedVideos(videoId)

    // Fallback to search-based if related videos returned too few
    if (results.length < 5) {
      const query = artist ? `${artist} similar songs` : `${title} remix mix`
      const searchResults = await performSearch(query, 15)
      // Merge: real recs first, then fill with search results
      const existingIds = new Set(results.map(r => r.videoId))
      const fillers = searchResults.filter(r => !existingIds.has(r.videoId) && r.videoId !== videoId)
      results = [...results, ...fillers].slice(0, 15)
    }

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
    if (chartId === 'top_hits') query = 'top hits 2025'

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

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[Stream] Vercel Request for ${videoId} from ${clientIp} (Range: ${req.headers.range || 'none'})`)

  try {
    // Check cache for resolved stream info
    let streamInfo = streamCache.get(videoId)

    if (!streamInfo || streamInfo === 'loading') {
      streamInfo = await getStreamUrl(videoId)
      streamCache.set(videoId, streamInfo)
    }

    const streamUrl = streamInfo.url
    const mimeType = streamInfo.mime || 'audio/webm'
    const userAgent = getRandomUA()

    // Force small 2MB chunk sizes for Vercel Serverless
    const CHUNK_SIZE = 1024 * 1024 * 2
    
    let range = req.headers.range || 'bytes=0-'
    let start = 0
    let end = undefined
    
    const parts = range.replace(/bytes=/, "").split("-")
    start = parseInt(parts[0], 10)
    if (parts[1]) end = parseInt(parts[1], 10)

    let totalSize = streamInfo.size || 0
    if (!totalSize) {
      try {
        const headRes = await fetch(streamUrl, { method: 'HEAD', headers: { 'User-Agent': userAgent } })
        totalSize = parseInt(headRes.headers.get('content-length') || '0', 10)
      } catch (e) {}
    }

    if (totalSize > 0) {
      if (end === undefined || end >= totalSize) end = totalSize - 1
      if (end - start + 1 > CHUNK_SIZE) end = start + CHUNK_SIZE - 1
    }

    const fetchOptions = { 
      headers: { 
        'Range': `bytes=${start}-${end !== undefined ? end : ''}`,
        'User-Agent': userAgent,
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com/',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      } 
    }
    
    const response = await fetch(streamUrl, fetchOptions)

    if (!response.ok && response.status !== 206) {
      throw new Error(`Upstream returned ${response.status}`)
    }

    // Set headers correctly
    res.status(response.status === 206 ? 206 : 200)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const upstreamRange = response.headers.get('content-range')
    const upstreamLength = response.headers.get('content-length')

    if (upstreamRange) res.setHeader('Content-Range', upstreamRange)
    else if (totalSize > 0 && response.status === 206) {
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`)
    }

    if (upstreamLength) res.setHeader('Content-Length', upstreamLength)
    else if (totalSize > 0) {
      res.setHeader('Content-Length', end !== undefined ? (end - start + 1) : (totalSize - start))
    }

    if (!response.body) return res.status(500).json({ error: 'Empty stream' })

    // Use Readable.fromWeb for clean piping on Node 18+ (Vercel's default)
    Readable.fromWeb(response.body).pipe(res)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)

    if (err.message?.includes('403') || err.message?.includes('expired') || err.message?.includes('status')) {
      streamCache.delete(videoId)
    }

    if (!res.headersSent) {
      res.status(500).json({ error: 'unavailable' })
    }
  }
})

// ─── Initialize Clients for Serverless ───
initPlayDl().catch(console.error)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Musify Standalone Server running on port ${PORT}`)
})

export default app
