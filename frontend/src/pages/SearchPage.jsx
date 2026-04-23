import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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

  useEffect(() => {
    if (location.state?.query) {
      setQuery(location.state.query)
    }
  }, [location.state?.query])

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query)
    } else {
      setResults([])
    }
  }, [query])

  const performSearch = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await searchSongs(q)
      setResults(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [])

  return (
    <div className="pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {query ? `Results for "${query}"` : 'Browse all'}
        </h1>
        {query && <p className="text-sm text-white/50 font-medium">Top results for your search</p>}
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)}
        </div>
      ) : results.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((song, i) => (
              <SongCard key={song.videoId} song={song} songs={results} index={i} />
            ))}
          </div>
        </motion.div>
      ) : query.length >= 2 && !loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32"
        >
          <p className="text-6xl mb-6">🔍</p>
          <p className="text-white font-bold text-xl mb-2">No results found for "{query}"</p>
          <p className="text-white/50 text-sm font-medium">Please make sure your words are spelled correctly or use fewer keywords.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32"
        >
          <p className="text-6xl mb-6">🎵</p>
          <p className="text-white font-bold text-xl mb-2">Search for your favorite music</p>
          <p className="text-white/50 text-sm font-medium">Click the magnifying glass above to start searching</p>
        </motion.div>
      )}
    </div>
  )
}
