import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import ytSearch from 'yt-search'
import ytdl from '@distube/ytdl-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ─── In-memory cache ───
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

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
  if (cache.size > 500) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

// ─── Scraper Helper ───
async function performScrape(query, limit = 20) {
  try {
    // Optimize query for music
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music') 
      ? query 
      : `${query} song`

    const r = await ytSearch(musicQuery)
    const videos = r.videos.slice(0, limit + 10) // Fetch extra for filtering
    
    return videos
      .filter(v => {
        const title = v.title.toLowerCase()
        const duration = v.seconds
        
        // 1. Filter out Shorts (usually < 60s)
        if (duration < 60) return false
        
        // 2. Filter out non-music keywords
        const blacklist = ['shorts', '#shorts', 'trailer', 'teaser', 'reaction', 'review', 'tutorial', 'vlog', 'gaming', 'unboxing']
        if (blacklist.some(word => title.includes(word))) return false
        
        return true
      })
      .slice(0, limit) // Return only requested limit after filtering
      .map(v => ({
        videoId: v.videoId,
        title: v.title,
        artist: v.author.name,
        channelTitle: v.author.name,
        thumbnail: v.thumbnail,
        duration: v.timestamp,
        views: v.views,
        publishedAt: v.ago || 'recently'
      }))
  } catch (err) {
    console.error('Scrape error:', err)
    return []
  }
}

// ─── Routes ───

// Search
app.get('/api/search', async (req, res) => {
  const query = req.query.q
  if (!query) return res.json({ results: [] })

  const cacheKey = `search:${query.toLowerCase().trim()}`
  const cached = getCached(cacheKey)
  if (cached) return res.json({ results: cached })

  const results = await performScrape(query)
  setCache(cacheKey, results)
  res.json({ results })
})

// Trending
app.get('/api/trending', async (req, res) => {
  const cached = getCached('trending')
  if (cached) return res.json({ results: cached })

  const results = await performScrape('trending music india 2024', 25)
  setCache('trending', results)
  res.json({ results })
})

// Artist Songs
app.get('/api/artist/:id/songs', async (req, res) => {
  const artistId = req.params.id
  const cacheKey = `artist:${artistId.toLowerCase()}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  const songs = await performScrape(`${artistId} top songs`, 30)
  const result = {
    artist: {
      id: artistId,
      name: artistId,
      image: songs[0]?.thumbnail || `https://picsum.photos/400/400?random=1`
    },
    songs
  }

  setCache(cacheKey, result)
  res.json(result)
})

// Recommendations
app.get('/api/recommendations', async (req, res) => {
  const { videoId, artist, title } = req.query
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' })

  const cacheKey = `rec:${videoId}`
  const cached = getCached(cacheKey)
  if (cached) return res.json({ results: cached })

  // Simulate recommendations by searching for artist and related keywords
  const query = artist ? `${artist} similar songs` : `${title} remix mix`
  let results = await performScrape(query, 15)
  
  // Filter out the current video
  results = results.filter(v => v.videoId !== videoId)

  setCache(cacheKey, results)
  res.json({ results })
})

// Charts
app.get('/api/charts/:id', async (req, res) => {
  const chartId = req.params.id
  const cacheKey = `chart:${chartId}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  let query = chartId.replace(/_/g, ' ')
  if (chartId === 'top_hits') query = 'top hits india 2024'
  
  const songs = await performScrape(query, 30)
  const result = {
    chart: { 
      id: chartId, 
      name: chartId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: 'Automatically updated from YouTube trends.'
    },
    songs
  }

  setCache(cacheKey, result)
  res.json(result)
})

// Download Route
app.get('/api/download', async (req, res) => {
  const { videoId, title } = req.query
  if (!videoId) return res.status(400).send('Video ID is required')

  try {
    const fileName = title ? `${title.replace(/[^\w\s]/gi, '')}.mp3` : `${videoId}.mp3`
    
    res.header('Content-Disposition', `attachment; filename="${fileName}"`)
    res.header('Content-Type', 'audio/mpeg')

    ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
      filter: 'audioonly',
      quality: 'highestaudio',
    }).pipe(res)
    
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).send('Failed to download audio')
  }
})

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`🎵 Vybe (Scraper-Only Mode) running on port ${PORT}`)
})
