/**
 * MUSIFY v2.0 — HomePage
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed recently played / history section
 * - Static dark gradient background (no animated gradients)
 * - Hero: simplified, DM Sans, violet accent
 * - Sections: Trending Hits, Top Artists, New Releases, Charts
 * - All sections use horizontal 64px song items
 * - No backdrop-filter blur anywhere
 */

import { useState, useEffect } from 'react'
import { getTrending } from '../utils/api.js'
import HomeRow from '../components/ui/HomeRow.jsx'

export default function HomePage() {
  const [trendingSongs, setTrendingSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getTrending()
        const filtered = data.filter(song => {
          const title = (song.title || '').toLowerCase()
          const artist = (song.artist || song.channelTitle || '').toLowerCase()
          return !title.includes('bhojpuri') && !artist.includes('bhojpuri')
        })
        setTrendingSongs(filtered)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  const artistCards = [
    { title: 'The Weeknd', artist: 'Artist', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg', isArtist: true },
    { title: 'Dua Lipa', artist: 'Artist', thumbnail: 'https://i.ytimg.com/vi/oygrmJFKYZY/mqdefault.jpg', isArtist: true },
    { title: 'Karan Aujla', artist: 'Artist', thumbnail: 'https://i.ytimg.com/vi/YmPjPKLPRH4/mqdefault.jpg', isArtist: true },
    { title: 'Arijit Singh', artist: 'Artist', thumbnail: 'https://i.ytimg.com/vi/5Eqb_-j3FDA/mqdefault.jpg', isArtist: true },
    { title: 'Post Malone', artist: 'Artist', thumbnail: 'https://i.ytimg.com/vi/UceaB4D0jpo/mqdefault.jpg', isArtist: true },
  ]

  const chartCards = [
    { title: 'Global Top 50', artist: 'The biggest hits worldwide', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
    { title: 'Viral Hits India', artist: 'Hottest tracks in India', thumbnail: 'https://i.ytimg.com/vi/5Eqb_-j3FDA/mqdefault.jpg' },
    { title: 'Hot 100 USA', artist: 'Most played in the USA', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
    { title: 'Bollywood Mix', artist: 'Top Bollywood tracks', thumbnail: 'https://i.ytimg.com/vi/YmPjPKLPRH4/mqdefault.jpg' },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 120 }}>
      {/* Hero */}
      <section style={{
        position: 'relative', width: '100%', padding: '60px 24px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '-30%', left: '20%', width: '60%', height: '80%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <h1 style={{
          fontSize: 'clamp(48px, 12vw, 96px)',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.04em', lineHeight: 1,
          marginBottom: 8, position: 'relative', zIndex: 1,
        }}>
          MUSIFY<span style={{ color: '#7C3AED' }}>.</span>
        </h1>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.5em',
          textTransform: 'uppercase', color: 'rgba(124,58,237,0.6)',
          position: 'relative', zIndex: 1,
        }}>
          Your Vibe, Your Sound
        </p>
      </section>

      {/* Content */}
      <div style={{ padding: '0 16px', maxWidth: 800, margin: '0 auto' }}>
        <HomeRow title="Trending Hits" items={trendingSongs.slice(0, 10)} loading={loading} />
        <HomeRow title="Top Artists" items={artistCards} isArtist={true} />
        <HomeRow title="New Releases" items={trendingSongs.slice(10, 20)} loading={loading} />
        <HomeRow title="Charts For You" items={chartCards} isChart={true} />
      </div>
    </div>
  )
}
