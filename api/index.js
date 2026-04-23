import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import ytSearch from 'yt-search'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ─── In-memory cache ───
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000 

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
  if (cache.size > 100) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

// ─── Scraper Helper ───
async function performScrape(query, limit = 20) {
  try {
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music') 
      ? query 
      : `${query} song`

    const r = await ytSearch(musicQuery)
    const videos = r.videos.slice(0, limit + 10)
    
    return videos
      .filter(v => {
        const title = v.title.toLowerCase()
        const duration = v.seconds
        if (duration < 60) return false
        const blacklist = ['shorts', '#shorts', 'trailer', 'teaser', 'reaction', 'review', 'tutorial', 'vlog', 'gaming', 'unboxing']
        if (blacklist.some(word => title.includes(word))) return false
        return true
      })
      .slice(0, limit)
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

app.get('/api/trending', async (req, res) => {
  const cached = getCached('trending')
  if (cached) return res.json({ results: cached })
  const results = await performScrape('trending music india 2024', 20)
  setCache('trending', results)
  res.json({ results })
})

app.get('/api/artist/:id/songs', async (req, res) => {
  const artistId = req.params.id
  const songs = await performScrape(`${artistId} top songs`, 30)
  res.json({
    artist: { id: artistId, name: artistId, image: songs[0]?.thumbnail || `https://picsum.photos/400/400?random=1` },
    songs
  })
})

app.get('/api/recommendations', async (req, res) => {
  const { videoId, artist, title } = req.query
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' })
  const results = await performScrape(artist ? `${artist} similar songs` : `${title} remix`, 10)
  res.json({ results: results.filter(v => v.videoId !== videoId) })
})

app.get('/api/charts/:id', async (req, res) => {
  const chartId = req.params.id
  let query = chartId.replace(/_/g, ' ')
  if (chartId === 'top_hits') query = 'top hits india 2024'
  const songs = await performScrape(query, 30)
  res.json({
    chart: { id: chartId, name: chartId.replace(/_/g, ' ') },
    songs
  })
})

export default app
