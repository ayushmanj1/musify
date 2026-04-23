import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ─── In-memory cache (Note: Serverless functions are stateless, so this will only persist within a single instance's lifecycle) ───
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
  if (cache.size > 100) { // Smaller cache for serverless
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
      return res.json({ results: getDemoResults(query) })
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      return res.json({ results: getDemoResults(query) })
    }

    const results = data.items
      .map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter(item => {
        const text = `${item.title} ${item.artist}`.toLowerCase()
        return !text.includes('bhojpuri')
      })

    setCache(cacheKey, results)
    res.json({ results })
  } catch (err) {
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

    const results = data.items
      .map(item => ({
        videoId: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter(item => {
        const text = `${item.title} ${item.artist}`.toLowerCase()
        return !text.includes('bhojpuri')
      })

    setCache('trending', results)
    res.json({ results })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending', results: [] })
  }
})

// ─── Artist Songs ───
app.get('/api/artist/:id/songs', async (req, res) => {
  try {
    const artistId = req.params.id
    if (!artistId) return res.status(400).json({ error: 'Artist ID is required' })

    const cacheKey = `artist:${artistId.toLowerCase()}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      return res.json({
        artist: { name: artistId, id: artistId, image: `https://picsum.photos/400/400?random=1` },
        songs: getDemoResults(artistId).slice(0, 10)
      })
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=30&q=${encodeURIComponent(artistId + ' songs')}&key=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      return res.json({
        artist: { name: artistId, id: artistId, image: `https://picsum.photos/400/400?random=1` },
        songs: getDemoResults(artistId)
      })
    }

    const songs = data.items
      .map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter(item => !item.title.toLowerCase().includes('bhojpuri'))

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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artist songs' })
  }
})

// ─── Recommendations ───
app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' })

    const cacheKey = `rec:${videoId}`
    const cached = getCached(cacheKey)
    if (cached) return res.json({ results: cached })

    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      return res.json({ results: getDemoResults(artist || title || 'trending').slice(0, 10) })
    }

    const cleanArtist = artist ? artist.replace(/ - Topic|VEVO|Official|Music|Records/gi, '').trim() : ''
    
    // 1. Fetch related videos
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&relatedToVideoId=${videoId}&key=${API_KEY}`
    let response = await fetch(url)
    let data = await response.json()

    let results = []
    if (data.items) {
      results = data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
      }))
    }

    // 2. Fetch artist-specific songs
    if (cleanArtist) {
      const artistUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(cleanArtist + ' top songs')}&key=${API_KEY}`
      const artistRes = await fetch(artistUrl)
      const artistData = await artistRes.json()
      
      if (artistData.items) {
        const artistSongs = artistData.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
        }))
        results = [...artistSongs, ...results]
      }
    }

    results = results
      .filter(item => item.videoId !== videoId)
      .filter(item => !item.title.toLowerCase().includes('bhojpuri'))
      .filter(item => !item.title.toLowerCase().includes('tutorial') && !item.title.toLowerCase().includes('reaction'))

    if (results.length < 5) {
      const trending = getDemoResults('trending').slice(0, 5)
      results = [...results, ...trending]
    }

    const uniqueResults = []
    const seen = new Set([videoId])
    results.forEach(r => {
      if (!seen.has(r.videoId)) {
        seen.add(r.videoId)
        uniqueResults.push(r)
      }
    })

    const finalResults = uniqueResults.slice(0, 10)
    setCache(cacheKey, finalResults)
    res.json({ results: finalResults })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations', results: getDemoResults('trending').slice(0, 10) })
  }
})

// ─── Charts ───
app.get('/api/charts/:id', async (req, res) => {
  try {
    const chartId = req.params.id
    const cacheKey = `chart:${chartId}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const API_KEY = process.env.YOUTUBE_API_KEY
    
    let query = ''
    let name = ''
    let description = ''

    switch (chartId) {
      case 'top_hits':
      case 'Top 50 - India':
        query = 'top hits india 2024'
        name = 'Top 50 - India'
        description = 'The most played tracks in India right now.'
        break
      case 'trending':
      case 'Trending Now':
        query = 'trending music india'
        name = 'Trending Now'
        description = 'Recently popular songs based on listener activity.'
        break
      case 'viral':
      case 'Viral 50 - India':
        query = 'viral songs india'
        name = 'Viral 50 - India'
        description = 'Fast-growing tracks across India.'
        break
      case 'top_global':
      case 'Top 50 - Global':
        query = 'top hits global'
        name = 'Top 50 - Global'
        description = 'Daily update of the most played tracks globally.'
        break
      default:
        query = chartId.replace(/_/g, ' ')
        name = query.charAt(0).toUpperCase() + query.slice(1)
        description = 'A curated list of popular songs.'
    }

    if (!API_KEY) {
      return res.json({
        chart: { id: chartId, name, description },
        songs: getDemoResults(query).slice(0, 20)
      })
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=30&q=${encodeURIComponent(query)}&key=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) {
      return res.json({
        chart: { id: chartId, name, description },
        songs: getDemoResults(query)
      })
    }

    const songs = data.items
      .map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter(item => !item.title.toLowerCase().includes('bhojpuri'))

    const result = {
      chart: { id: chartId, name, description },
      songs
    }

    setCache(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chart' })
  }
})

function getDemoResults(query) {
  const allSongs = [
    { videoId: 'dQw4w9WgXcQ', title: 'Winning Speech', artist: 'Karan Aujla', channelTitle: 'Karan Aujla', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    { videoId: 'fJ9rUzIMcZQ', title: 'Softly', artist: 'Karan Aujla', channelTitle: 'Karan Aujla', thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
    { videoId: '60ItHLz5WEA', title: 'White Brown Black', artist: 'Karan Aujla', channelTitle: 'Karan Aujla', thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg' },
    { videoId: 'JGwWNGJdvx8', title: 'Players', artist: 'Badshah ft. Karan Aujla', channelTitle: 'Badshah', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
    { videoId: 'kJQP7kiw5Fk', title: 'Admiring You', artist: 'Karan Aujla', channelTitle: 'Karan Aujla', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
    { videoId: 'RgKAFK5djSk', title: 'Elevated', artist: 'Shubh', channelTitle: 'Shubh', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg' },
    { videoId: 'OPf0YbXqDm0', title: '295', artist: 'Sidhu Moose Wala', channelTitle: 'Sidhu Moose Wala', thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
    { videoId: 'pRpeEdMmmQ0', title: 'Kesariya', artist: 'Arijit Singh', channelTitle: 'Sony Music India', thumbnail: 'https://img.youtube.com/vi/pRpeEdMmmQ0/hqdefault.jpg' },
    { videoId: 'CevxZvSJLk8', title: 'System Pe System', artist: 'RMC', channelTitle: 'Haryanvi Hits', thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg' },
    { videoId: 'YQHsXMglC9A', title: 'Tu Maan Meri Jaan', artist: 'King', channelTitle: 'King', thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg' },
    { videoId: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', channelTitle: 'Rick Astley', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
  ]
  return [...allSongs].sort(() => Math.random() - 0.5)
}

export default app
