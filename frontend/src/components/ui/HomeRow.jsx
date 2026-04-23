import { useRef, memo } from 'react'
import { motion } from 'framer-motion'
import SongCard from './SongCard.jsx'

const HomeRow = memo(({ 
  title, 
  items = [], 
  loading = false,
  isArtist = false,
  isChart = false,
  showProgress = false,
  isNew = false,
  isLarge = false,
  showRank = false
}) => {
  const scrollRef = useRef(null)

  if (!loading && items.length === 0) return null

  const displayItems = loading ? Array.from({ length: 7 }).map((_, i) => ({ videoId: `skeleton-${i}` })) : items

  return (
    <section className="relative mb-12 md:mb-20">
      <div className="px-4 md:px-2 mb-4 md:mb-6">
        <h2 className="section-heading text-[11px] md:text-[13px] font-black text-white/20 uppercase tracking-[0.4em] leading-none">
          {title}
        </h2>
      </div>

      <div className="relative group">
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-6 px-4 md:px-0 w-full hide-scrollbar pb-6 snap-x snap-mandatory">
          {displayItems.map((item, i) => (
            <div key={item.videoId || i} className="snap-start flex-shrink-0">
              <SongCard 
                song={item} 
                songs={items}
                index={i} 
                isArtist={isArtist} 
                isChart={isChart}
                showProgress={showProgress}
                isNew={isNew}
                rank={showRank ? i + 1 : null}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default HomeRow
