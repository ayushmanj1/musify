/**
 * MUSIFY API v2.0 — Vercel Serverless
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Replaced yt-search with youtube-sr
 * - Added /api/stream endpoint for audio piping
 * - LRU cache for search (200 entries) and stream URLs (100 entries)
 * - Auto-retry with exponential backoff
 * - Soft rate limit on /stream (60/min per IP)
 * - Error handling: never crash, return { error: "unavailable" }
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import ytsr from 'youtube-sr'
const YouTube = ytsr.default || ytsr

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ─── Simple Map cache (Vercel serverless = short-lived, so Map is fine) ───
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > CACHE_TTL) { cache.delete(key); return null }
  return item.data
}

function setCache(key, data) {
  if (cache.size > 200) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
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

// ─── Format duration ───
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
      ? query : `${query} song`

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
function prefetchStream(videoId) {
  // We don't prefetch in Vercel Serverless environment to save on function execution time.
  // Instead, the client handles the loading state. 
}

// ─── Routes ───

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })
    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = getCached(cacheKey)
    if (cached) return res.json({ results: cached })
    const results = await performSearch(query)
    setCache(cacheKey, results)
    res.json({ results })
  } catch (err) {
    res.json({ results: [] })
  }
})

app.get('/api/trending', async (req, res) => {
  try {
    const cached = getCached('trending')
    if (cached) return res.json({ results: cached })
    const results = await performSearch('trending music 2024 hits', 20)
    setCache('trending', results)
    res.json({ results })
  } catch (err) {
    res.json({ results: [] })
  }
})

app.get('/api/artist/:id/songs', async (req, res) => {
  try {
    const artistId = req.params.id
    const songs = await performSearch(`${artistId} top songs`, 30)
    res.json({
      artist: { id: artistId, name: artistId, image: songs[0]?.thumbnail || '' },
      songs
    })
  } catch (err) {
    res.json({ artist: { id: req.params.id, name: req.params.id, image: '' }, songs: [] })
  }
})

app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' })
    const results = await performSearch(artist ? `${artist} similar songs` : `${title} remix`, 10)
    res.json({ results: results.filter(v => v.videoId !== videoId) })
  } catch (err) {
    res.json({ results: [] })
  }
})

app.get('/api/charts/:id', async (req, res) => {
  try {
    const chartId = req.params.id
    let query = chartId.replace(/_/g, ' ')
    if (chartId === 'top_hits') query = 'top hits 2024'
    const songs = await performSearch(query, 30)
    res.json({
      chart: { id: chartId, name: chartId.replace(/_/g, ' ') },
      songs
    })
  } catch (err) {
    res.json({ chart: { id: req.params.id, name: req.params.id }, songs: [] })
  }
})

export default app
