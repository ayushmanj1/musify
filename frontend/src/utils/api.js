import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

// Search cache
const searchCache = new Map()
const artworkCache = new Map()

export async function searchSongs(query) {
  if (!query || query.trim().length < 2) return []
  
  const cacheKey = query.trim().toLowerCase()
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)

  try {
    const { data } = await api.get('/search', { params: { q: query } })
    const results = data.results || []
    searchCache.set(cacheKey, results)
    return results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export async function getTrending() {
  try {
    const { data } = await api.get('/trending')
    return data.results || []
  } catch (error) {
    console.error('Trending error:', error)
    return []
  }
}

export async function getArtistSongs(artistId) {
  try {
    const { data } = await api.get(`/artist/${encodeURIComponent(artistId)}/songs`)
    return data
  } catch (error) {
    console.error('Artist songs error:', error)
    throw error
  }
}

export async function getChart(chartId) {
  try {
    const { data } = await api.get(`/charts/${encodeURIComponent(chartId)}`)
    return data
  } catch (error) {
    console.error('Chart error:', error)
    throw error
  }
}

export function getSuggestions(query) {
  if (!query || query.length < 2) return []
  const keywords = ['latest hits', 'trending', 'top music', 'remix', 'lofi', 'bollywood', 'pop', 'hip hop']
  const q = query.toLowerCase()
  return keywords.filter(k => k.includes(q)).map(k => `${query} ${k}`).slice(0, 5)
}

/**
 * Validates if an image URL is functional
 */
async function validateImageUrl(url) {
  if (!url) return false
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.width > 50)
    img.onerror = () => resolve(false)
    img.src = url
    setTimeout(() => resolve(false), 3000)
  })
}

/**
 * Fetches higher quality artwork from iTunes API
 */
export async function enrichSongMetadata(song) {
  if (!song || !song.title) return song
  
  const cacheKey = `${song.title}-${song.artist}`.toLowerCase()
  if (artworkCache.has(cacheKey)) return artworkCache.get(cacheKey)

  try {
    // Clean title for better iTunes matching
    const cleanTitle = song.title
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Video.*?\)/gi, '')
      .replace(/\[Video.*?\]/gi, '')
      .replace(/\(Lyric.*?\)/gi, '')
      .replace(/\[Lyric.*?\]/gi, '')
      .replace(/\(Live.*?\)/gi, '')
      .replace(/\[Live.*?\]/gi, '')
      .replace(/\bfeat\..*?\b/gi, '')
      .replace(/\bft\..*?\b/gi, '')
      .trim()

    const query = encodeURIComponent(`${cleanTitle} ${song.artist || ''}`)
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
    const data = await response.json()

    if (data.results && data.results[0]) {
      const result = data.results[0]
      const albumArt = result.artworkUrl100?.replace('100x100bb', '1000x1000bb')
      
      const enriched = {
        ...song,
        albumArt: albumArt,
        albumName: result.collectionName,
        isEnriched: true
      }
      
      artworkCache.set(cacheKey, enriched)
      return enriched
    }
  } catch (error) {
    console.warn('[iTunes] Enrichment failed:', error)
  }

  // Fallback to original thumbnail before gradient
  const fallback = {
    ...song,
    albumArt: song.thumbnail || generateGradientUrl(song.title),
    isEnriched: true
  }
  artworkCache.set(cacheKey, fallback)
  return fallback
}

/**
 * Generates a beautiful deterministic gradient
 */
export function generateGradientUrl(text) {
  const str = text || 'Music'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const h1 = Math.abs(hash % 360)
  const h2 = (h1 + 60) % 360
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${h1},70%,45%)"/>
        <stop offset="100%" style="stop-color:hsl(${h2},70%,25%)"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <text x="200" y="210" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="120" font-family="sans-serif" font-weight="900">${str.charAt(0).toUpperCase()}</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export async function getRecommendations(videoId, artist, title) {
  try {
    const { data } = await api.get('/recommendations', {
      params: { videoId, artist, title }
    })
    return data.results || []
  } catch (error) {
    console.error('Recommendations error:', error)
    return []
  }
}
