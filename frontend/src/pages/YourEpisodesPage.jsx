import { FiPlus, FiChevronDown } from 'react-icons/fi'

export default function YourEpisodesPage() {
  const filters = ['Unplayed', 'Available offline', 'In Progress', 'Video']

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="p-8 pt-12 rounded-t-xl" style={{ background: 'linear-gradient(135deg, rgba(20,120,120,0.4), rgba(6,6,8,0.9))' }}>
        <div className="flex items-center gap-6">
          <div className="w-48 h-48 rounded-[20px] flex items-center justify-center" style={{ background: 'rgba(20,120,120,0.3)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
            <span className="text-white text-7xl">🔖</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2 text-white/50">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-black mb-4 text-white">Your Episodes</h1>
            <p className="text-sm font-medium text-white/40">Musify User • 0 episodes</p>
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
                className="px-4 py-1.5 rounded-full text-white/60 text-[13px] font-medium transition-all hover:text-white/80 glass-btn"
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-white/40 hover:text-white cursor-pointer transition-colors">
            <span className="text-[13px] font-medium">Recently added</span>
            <FiChevronDown />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-white/25 glass-btn" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <FiPlus className="text-3xl" />
          </div>
          <h2 className="section-heading text-2xl font-bold text-white/80">Add to Your Episodes</h2>
          <p className="text-white/35 max-w-sm">
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
