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
    { title: 'Karan Aujla', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', isArtist: true },
    { title: 'Arijit Singh', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop', isArtist: true },
    { title: 'The Weeknd', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&h=400&fit=crop', isArtist: true },
    { title: 'Sidhu Moose Wala', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', isArtist: true },
    { title: 'Badshah', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop', isArtist: true },
    { title: 'Dua Lipa', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1520127877998-122c33e8eb38?w=400&h=400&fit=crop', isArtist: true },
    { title: 'Post Malone', artist: 'Artist', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=400&h=400&fit=crop', isArtist: true },
  ]

  const chartCards = [
    { title: 'Top 50 - Global', artist: 'Daily update of the most played tracks.', thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop' },
    { title: 'Top 50 - India', artist: 'The hottest tracks in India.', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=400&h=400&fit=crop' },
    { title: 'Viral 50 - India', artist: 'Most viral tracks in India.', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop' },
    { title: 'Top 50 - USA', artist: 'Most played in the USA.', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&h=400&fit=crop' },
    { title: 'Hot Hits Hindi', artist: 'Hottest Hindi tracks.', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
    { title: 'Viral 50 - Global', artist: 'Viral tracks across the globe.', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
    { title: 'Top 50 - UK', artist: 'Most played in the UK.', thumbnail: 'https://images.unsplash.com/photo-1520127877998-122c33e8eb38?w=400&h=400&fit=crop' },
  ]

  const mixes = [
    { title: 'Daily Mix 1', artist: 'Karan Aujla, Sidhu Moose Wala...', thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop' },
    { title: 'Chill Mix', artist: 'The Weeknd, Post Malone...', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=400&h=400&fit=crop' },
    { title: 'Lofi Beats', artist: 'Study & Relax', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
    { title: 'Pop Mix', artist: 'Dua Lipa, Taylor Swift...', thumbnail: 'https://images.unsplash.com/photo-1520127877998-122c33e8eb38?w=400&h=400&fit=crop' },
    { title: 'Gaming Mix', artist: 'Electronic Hits', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
    { title: 'Daily Mix 2', artist: 'Arijit Singh, Shreya Ghoshal...', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&h=400&fit=crop' },
    { title: 'Workout Mix', artist: 'Energetic Tracks', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 min-h-screen"
    >
      {/* 🏷️ PREMIUM HERO HEADER */}
      <section className="relative w-full h-[300px] md:h-[400px] flex flex-col items-center justify-center overflow-hidden mb-12">
        {/* Background Gradient & Glow */}
        <div className="absolute inset-0 hero-gradient opacity-90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/20 blur-[120px] rounded-full animate-pulse" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 text-center"
        >
          <h1 className="text-[60px] md:text-[120px] font-black text-white tracking-[0.25em] leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-4">
            MUSIFY
          </h1>
          <p className="text-[12px] md:text-[16px] font-bold text-white/80 tracking-[0.5em] uppercase">
            Elevate Your Sound
          </p>
        </motion.div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505] to-transparent" />
      </section>

      <div className="px-4 md:px-12 max-w-[1800px] mx-auto space-y-48 md:space-y-64 mb-64">
        {/* 1. Recently Played */}
        {recentlyPlayed.length > 0 && (
          <HomeRow 
            title="Recently Played" 
            items={recentlyPlayed.slice(0, 7)} 
            showProgress={true}
          />
        )}

        {/* 2. Top Artists */}
        <HomeRow 
          title="Top Artists" 
          items={artistCards} 
          isArtist={true}
        />

        {/* 3. Trending Now */}
        <HomeRow 
          title="Trending Now" 
          items={trendingSongs.slice(0, 14)} 
          loading={loading}
        />

        {/* 4. Recommended For You */}
        <HomeRow 
          title="Recommended For You" 
          items={trendingSongs.slice(14, 28)} 
          loading={loading}
        />

        {/* 5. New Releases */}
        <HomeRow 
          title="New Releases" 
          items={trendingSongs.slice(28, 42)} 
          loading={loading}
          isNew={true}
        />

        {/* 6. Top Charts */}
        <HomeRow 
          title="Top Charts" 
          items={chartCards.slice(0, 14)} 
          isChart={true}
          showRank={true}
        />

        {/* 7. Made For You / Mixes */}
        <HomeRow 
          title="Made For You Mixes" 
          items={[...playlists, ...mixes].slice(0, 14)} 
        />
      </div>

      {/* Aesthetic Bottom Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />
    </motion.div>
  )
}
