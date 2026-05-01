/**
 * MUSIFY — Search Screen
 * Search bar + Browse Categories grid + Song results
 */

import { useState, useRef, useCallback } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { searchSongs } from '../utils/api.js'
import { FiSearch, FiX } from 'react-icons/fi'

/* ─── Browse Categories ─── */
const CATEGORIES = [
  { name: 'Pop', color: '#E61E32', query: 'pop hits 2024' },
  { name: 'Hip-Hop', color: '#BA5D07', query: 'hip hop hits 2024' },
  { name: 'Rock', color: '#8C67AC', query: 'rock hits 2024' },
  { name: 'Electronic', color: '#0D73EC', query: 'electronic dance music' },
  { name: 'Indie', color: '#477D95', query: 'indie music 2024' },
  { name: 'Chill', color: '#1E3264', query: 'chill lofi beats' },
  { name: 'Bollywood', color: '#E13300', query: 'bollywood hits 2024' },
  { name: 'Punjabi', color: '#7D4B32', query: 'punjabi songs 2024' },
]

/* ─── Song Result Row ─── */
function SongRow({ song, onClick }) {
  const mins = Math.floor((song.durationSec || 0) / 60)
  const secs = (song.durationSec || 0) % 60
  return (
    <button
      className="song-row"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', height: 56, padding: '0 16px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-primary)', touchAction: 'manipulation',
      }}
    >
      <img src={song.thumbnail} alt="" width={48} height={48} loading="lazy"
        style={{ borderRadius: 'var(--radius-base)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <p className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{song.title}</p>
        <p className="truncate" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{song.artist}</p>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
        {song.duration || ''}
      </span>
    </button>
  )
}

/* ─── Skeleton Results ─── */
function SkeletonResults() {
  return (
    <div style={{ padding: '12px 0' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-base)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══ SEARCH PAGE ═══ */
export default function SearchPage() {
  const { playSong } = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setHasSearched(false); return }
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await searchSongs(q)
      setResults(data || [])
    } catch (e) {
      console.error('Search error:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 350)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
    inputRef.current?.focus()
  }

  const handleCategoryClick = (cat) => {
    setQuery(cat.name)
    doSearch(cat.query)
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: '48px 16px 8px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Search</h1>

        {/* ─── Search Bar ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)', borderRadius: 'var(--radius-base)',
          height: 48, padding: '0 14px',
        }}>
          <FiSearch size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="What do you want to listen to?"
            style={{
              flex: 1, height: '100%', fontSize: 14, fontWeight: 500,
              touchAction: 'manipulation',
            }}
          />
          {query && (
            <button onClick={handleClear} style={{
              background: 'none', border: 'none', padding: 4, cursor: 'pointer',
              color: 'var(--text-primary)', touchAction: 'manipulation',
            }}>
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Content: Categories or Results ─── */}
      {!hasSearched ? (
        /* Browse Categories */
        <div style={{ padding: '20px 16px 0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Browse all</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  position: 'relative', height: 96, borderRadius: 'var(--radius-card)',
                  background: cat.color, border: 'none', cursor: 'pointer',
                  overflow: 'hidden', textAlign: 'left', padding: '12px 14px',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1 }}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Search Results */
        <div style={{ paddingTop: 8 }}>
          {loading ? (
            <SkeletonResults />
          ) : results.length > 0 ? (
            <>
              <p style={{ fontSize: 14, fontWeight: 700, padding: '8px 16px', color: 'var(--text-primary)' }}>
                Songs
              </p>
              {results.map((song, i) => (
                <SongRow key={song.videoId} song={song}
                  onClick={() => playSong(song, results, i)} />
              ))}
            </>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '64px 32px', color: 'var(--text-secondary)',
            }}>
              <FiSearch size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No results found</p>
              <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
