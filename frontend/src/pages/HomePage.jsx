import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getTrending } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import SongCard from '../components/ui/SongCard.jsx'

export default function HomePage() {
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
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
        setSongs(filtered)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const artistCards = [
    { title: 'Karan Aujla', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=50', isArtist: true },
    { title: 'Arijit Singh', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=51', isArtist: true },
    { title: 'Sidhu Moose Wala', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=52', isArtist: true },
    { title: 'Badshah', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=53', isArtist: true },
    { title: 'Ar Rahman', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=54', isArtist: true },
    { title: 'The Weeknd', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=55', isArtist: true },
    { title: 'RMC (Haryanvi)', artist: 'Artist', thumbnail: 'https://picsum.photos/200/200?random=56', isArtist: true },
  ]

  const radioStations = [
    { videoId: 'kJQP7kiw5Fk', title: 'Arijit Singh Radio', artist: 'With Sachin-Jigar, Pritam, etc.', thumbnail: 'https://picsum.photos/200/200?random=20' },
    { videoId: 'dQw4w9WgXcQ', title: 'KK Radio', artist: 'With Pritam, Shaarib Toshi, etc.', thumbnail: 'https://picsum.photos/200/200?random=21' },
    { videoId: 'fLexgOxsZu0', title: 'A.R. Rahman Radio', artist: 'With Hariharan, Chinmayi, etc.', thumbnail: 'https://picsum.photos/200/200?random=22' },
    { videoId: 'OPf0YbXqDm0', title: 'Kishore Kumar Radio', artist: 'With Mukesh, Lata Mangeshkar, etc.', thumbnail: 'https://picsum.photos/200/200?random=23' },
    { videoId: 'JGwWNGJdvx8', title: 'Shreya Ghoshal Radio', artist: 'With Alka Yagnik, Jatin-Lalit, etc.', thumbnail: 'https://picsum.photos/200/200?random=24' },
    { videoId: 'kJQP7kiw5Fk', title: 'Lofi Beats', artist: 'Study & Relax', thumbnail: 'https://picsum.photos/200/200?random=25' },
    { videoId: 'kJQP7kiw5Fk', title: 'Global Top Hits', artist: 'Daily Update', thumbnail: 'https://picsum.photos/200/200?random=26' },
  ]

  const chartCards = [
    { title: 'Top 50 - India', artist: 'Daily update of the most played tracks in India.', thumbnail: 'https://picsum.photos/200/200?random=30' },
    { title: 'Top 50 - Global', artist: 'Daily update of the most played tracks globally.', thumbnail: 'https://picsum.photos/200/200?random=31' },
    { title: 'Viral 50 - India', artist: 'The most viral tracks in India right now.', thumbnail: 'https://picsum.photos/200/200?random=32' },
    { title: 'Hot Hits Hindi', artist: 'Hottest Hindi tracks you need to hear.', thumbnail: 'https://picsum.photos/200/200?random=33' },
    { title: 'Viral 50 - Global', artist: 'Viral tracks across the globe.', thumbnail: 'https://picsum.photos/200/200?random=34' },
    { title: 'Top 50 - USA', artist: 'Most played in the USA.', thumbnail: 'https://picsum.photos/200/200?random=35' },
    { title: 'Top 50 - UK', artist: 'Most played in the UK.', thumbnail: 'https://picsum.photos/200/200?random=36' },
  ]

  const renderSection = (title, items, isRadio = false, isChart = false) => (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-end justify-between mb-6 px-2">
        <h2 className="text-[26px] font-bold text-white tracking-tight hover:text-[#1DB954] cursor-pointer transition-colors">{title}</h2>
        <button className="text-[13px] font-black text-white/30 hover:text-white transition-colors tracking-widest uppercase">View All</button>
      </div>
      <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 px-1">
        {items.map((item, i) => (
          <SongCard key={i} song={item} index={i} isRadio={isRadio || item.isArtist} isChart={isChart} />
        ))}
      </div>
    </section>
  )

  return (
    <div className="pb-32 px-6 max-w-[1600px] mx-auto mt-4">
      {/* Popular albums and singles */}
      {renderSection('Popular albums and singles', loading ? Array.from({length: 7}).map(() => ({})) : songs.slice(0, 7))}

      {/* Recommended Artists */}
      {renderSection('Popular Artists', artistCards)}

      {/* Charts */}
      {renderSection('Charts', chartCards, false, true)}

      {/* India's Best */}
      {renderSection("India's Best", loading ? Array.from({length: 7}).map(() => ({})) : songs.slice(7, 14))}

      {/* Recommended for you */}
      {renderSection('Recommended for you', loading ? Array.from({length: 7}).map(() => ({})) : songs.slice(14, 21))}

      {/* Fresh New Music */}
      {renderSection('Fresh New Music', loading ? Array.from({length: 7}).map(() => ({})) : songs.slice(21, 28))}

      {/* Popular radio (Moved to last) */}
      {renderSection('Popular radio', radioStations, true)}
    </div>
  )
}
