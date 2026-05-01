/**
 * MUSIFY v2.0 — SearchPage
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Uses 64px horizontal song items instead of grid cards
 * - Skeleton uses CSS pulse
 * - No backdrop-filter blur
 * - overscroll-behavior: contain
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { searchSongs } from '../utils/api.js'
import SongCard from '../components/ui/SongCard.jsx'
import { SongCardSkeleton } from '../components/ui/Skeleton.jsx'

export default function SearchPage() {
  const location = useLocation()
  const initialQuery = location.state?.query || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const performSearch = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await searchSongs(q)
      setResults(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (location.state?.query) setQuery(location.state.query)
  }, [location.state?.query])

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query)
    } else {
      setResults([])
    }
  }, [query, performSearch])

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      {query && (
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
          marginBottom: 16,
        }}>
          Results for "{query}"
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {results.map((song, i) => (
            <SongCard key={song.videoId} song={song} songs={results} index={i} />
          ))}
        </div>
      ) : query.length >= 2 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>No results for "{query}"</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Check your spelling or try fewer keywords</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🎵</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Search for your favorite music</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Tap the search icon to get started</p>
        </div>
      )}
    </div>
  )
}
