import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

// Search cache
const searchCache = new Map()

export async function searchSongs(query) {
  if (!query || query.trim().length < 2) return []
  
  const cacheKey = query.trim().toLowerCase()
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)
  }

  try {
    const { data } = await api.get('/search', { params: { q: query } })
    const results = data.results || []
    searchCache.set(cacheKey, results)
    
    // Limit cache size
    if (searchCache.size > 100) {
      const firstKey = searchCache.keys().next().value
      searchCache.delete(firstKey)
    }
    
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
  
  const keywords = [
    'latest hits', 'trending songs', 'top music', 'best of',
    'remix', 'acoustic', 'live performance', 'official video',
    'lyrics', 'slowed reverb', 'lofi', 'playlist', 'mix',
    'bollywood hits', 'pop songs', 'hip hop', 'rock music',
    'edm', 'classical', 'jazz', 'r&b', 'country'
  ]
  
  const q = query.toLowerCase()
  return keywords
    .filter(k => k.includes(q) || q.split(' ').some(w => k.includes(w)))
    .map(k => `${query} ${k}`)
    .slice(0, 5)
}

// iTunes Enrichment Cache
const itunesCache = new Map()

export async function enrichSongMetadata(song) {
  if (!song || !song.title) return song
  
  const cacheKey = `${song.title}-${song.artist || ''}`.toLowerCase().trim()
  if (itunesCache.has(cacheKey)) {
    return { ...song, ...itunesCache.get(cacheKey) }
  }

  try {
    const searchTerm = encodeURIComponent(`${song.title} ${song.artist || ''}`)
    const response = await axios.get(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`)
    
    if (response.data.results && response.data.results[0]) {
      const result = response.data.results[0]
      const enrichment = {
        albumArt: result.artworkUrl100.replace('100x100bb', '600x600bb'),
        itunesArtist: result.artistName,
        itunesTitle: result.trackName,
        albumName: result.collectionName,
        isEnriched: true
      }
      
      itunesCache.set(cacheKey, enrichment)
      return { ...song, ...enrichment }
    }
  } catch (error) {
    console.error('iTunes Enrichment error:', error)
  }
  
  return song
}

export async function getRecommendations(videoId, artist, title) {
  try {
    const { data } = await api.get('/recommendations', {
      params: { videoId, artist, title }
    })
    return data.results || []
  } catch (error) {
    console.error('Recommendations error:', error)
    // Robust fallback to trending if recommendations API fails
    try {
      const { data } = await api.get('/trending')
      return data.results || []
    } catch {
      return []
    }
  }
}
