import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ─── In-memory cache ───
const cache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return item.data
}

function setCache(key, data) {
  // Limit cache size
  if (cache.size > 500) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

// ─── YouTube Search ───
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })

    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = getCached(cacheKey)
    if (cached) return res.json({ results: cached })

    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      console.warn('No YouTube API key set. Returning demo results.')
      return res.json({ results: getDemoResults(query) })
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      console.error('YouTube API error:', data)
      return res.json({ results: getDemoResults(query) })
    }

    const results = data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }))

    setCache(cacheKey, results)
    res.json({ results })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed', results: [] })
  }
})

// ─── Trending ───
app.get('/api/trending', async (req, res) => {
  try {
    const cached = getCached('trending')
    if (cached) return res.json({ results: cached })

    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      return res.json({ results: getDemoResults('trending') })
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=10&maxResults=20&regionCode=IN&key=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      return res.json({ results: getDemoResults('trending') })
    }

    const results = data.items.map(item => ({
      videoId: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
    }))

    setCache('trending', results)
    res.json({ results })
  } catch (err) {
    console.error('Trending error:', err)
    res.status(500).json({ error: 'Failed to fetch trending', results: [] })
  }
})

// ─── Demo results fallback ───
function getDemoResults(query) {
  const allSongs = [
    { videoId: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', channelTitle: 'Rick Astley', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', channelTitle: 'Queen Official', thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
    { videoId: '60ItHLz5WEA', title: 'Alan Walker - Faded', artist: 'Alan Walker', channelTitle: 'Alan Walker', thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg' },
    { videoId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', channelTitle: 'Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
    { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', channelTitle: 'Luis Fonsi', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
    { videoId: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', channelTitle: 'Wiz Khalifa', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg' },
    { videoId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', channelTitle: 'Mark Ronson', thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
    { videoId: 'pRpeEdMmmQ0', title: 'Shake It Off', artist: 'Taylor Swift', channelTitle: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/pRpeEdMmmQ0/hqdefault.jpg' },
    { videoId: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', channelTitle: 'Katy Perry', thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg' },
    { videoId: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', channelTitle: 'Adele', thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg' },
  ]
  return [...allSongs].sort(() => Math.random() - 0.5)
}

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')))

// Catch-all handler for any request that doesn't match an API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`🎵 Vybe backend running on port ${PORT}`)
})
