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
