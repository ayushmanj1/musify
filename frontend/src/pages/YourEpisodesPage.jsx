import { motion } from 'framer-motion'
import { FiPlus, FiChevronDown } from 'react-icons/fi'

export default function YourEpisodesPage() {
  const filters = ['Unplayed', 'Available offline', 'In Progress', 'Video']

  return (
    <div className="min-h-full">
      {/* Teal Header */}
      <div className="bg-teal-700 p-8 pt-12 rounded-t-xl">
        <div className="flex items-center gap-6">
          <div className="w-48 h-48 bg-teal-800 rounded-lg shadow-2xl flex items-center justify-center">
            <span className="text-white text-7xl">🔖</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-8xl font-black mb-6">Your Episodes</h1>
            <p className="text-sm font-medium">Ayushman Jha • 0 episodes</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium transition-colors"
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
            <span className="text-[13px] font-medium">Recently added</span>
            <FiChevronDown />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mb-6 text-white/40">
            <FiPlus className="text-3xl" />
          </div>
          <h2 className="section-heading text-2xl font-bold">Add to Your Episodes</h2>
          <p className="text-white/60 max-w-sm">
            Save episodes to this playlist by tapping the plus icon on any episode.
          </p>
          <button className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
            Browse episodes
          </button>
        </div>
      </div>
    </div>
  )
}
