import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getTrending } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import HomeRow from '../components/ui/HomeRow.jsx'

export default function HomePage() {
  const { recentlyPlayed, playlists } = usePlayer()
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
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const artistCards = [
    { title: 'The Weeknd', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Dua Lipa', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1520127877998-122c33e8eb38?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Karan Aujla', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Arijit Singh', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Post Malone', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Sidhu Moose Wala', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', isArtist: true },
    { title: 'Badshah', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=600&h=600&fit=crop', isArtist: true },
  ]

  const chartCards = [
    { title: 'Global Top 50', artist: 'The biggest hits worldwide.', thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop' },
    { title: 'Viral Hits India', artist: 'Hottest tracks in India.', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop' },
    { title: 'Hot 100 USA', artist: 'Most played in the USA.', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop' },
    { title: 'Bollywood Mix', artist: 'Top Bollywood tracks.', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop' },
    { title: 'Indie India', artist: 'Best of Indian Indie.', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop' },
    { title: 'Viral Global', artist: 'Viral tracks globally.', thumbnail: 'https://images.unsplash.com/photo-1520127877998-122c33e8eb38?w=600&h=600&fit=crop' },
    { title: 'UK Top 40', artist: 'Charts from the UK.', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=600&h=600&fit=crop' },
  ]

  return (
    <div className="pb-32 min-h-screen">
      {/* PREMIUM HERO (Optimized) */}
      <section className="relative w-full h-[240px] md:h-[340px] flex flex-col items-center justify-center overflow-hidden mb-6">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-lavender/20 via-lavender/5 to-transparent" />
        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.15),transparent_60%)] animate-pulse" />
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-6"
        >
          <h1 className="text-[54px] md:text-[100px] font-black text-white tracking-tighter leading-none mb-3 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            MUSIFY<span className="text-lavender">.</span>
          </h1>
          <p className="text-[11px] md:text-[13px] font-black text-lavender/80 tracking-[0.6em] uppercase drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
            Your Vibe, Your Sound
          </p>
        </motion.div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
      </section>

      <div className="px-4 md:px-10 max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-12">
        {recentlyPlayed.length > 0 && (
          <HomeRow title="Recently Played" items={recentlyPlayed.slice(0, 7)} showProgress={true} />
        )}
        <HomeRow title="Top Artists" items={artistCards} isArtist={true} />
        <HomeRow title="Trending Hits" items={trendingSongs.slice(0, 14)} loading={loading} />
        <HomeRow title="New Releases" items={trendingSongs.slice(14, 28)} loading={loading} isNew={true} />
        <HomeRow title="Charts for You" items={chartCards} isChart={true} showRank={true} />
      </div>
    </div>
  )
}
