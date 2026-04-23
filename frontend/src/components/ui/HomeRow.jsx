import { useRef } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import SongCard from './SongCard.jsx'

export default function HomeRow({ 
  title, 
  items = [], 
  loading = false,
  isArtist = false,
  isChart = false,
  showProgress = false,
  isNew = false,
  isLarge = false,
  showRank = false
}) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  if (!loading && items.length === 0) return null

  const displayItems = loading ? Array.from({ length: 7 }).map(() => ({})) : items

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -20px 0px" }}
      transition={{ duration: 0.4 }}
      className="relative z-10 mb-40 md:mb-56"
    >
      <div className="px-4 md:px-16 relative z-10 pt-12 pb-5 md:pt-16 md:pb-6">
        <div>
          <h2 className="section-heading text-[14px] md:text-[20px] font-black text-white/40 uppercase tracking-[0.6em] leading-none">
            {title}
          </h2>
        </div>
      </div>

      <div className="relative z-10">
        {/* The Solid Grid - Strictly 7 Columns */}
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-5 md:gap-16 px-4 md:px-2 w-full hide-scrollbar snap-x snap-mandatory pb-4">
          {displayItems.map((item, i) => (
            <SongCard 
              key={i} 
              song={item} 
              songs={items}
              index={i} 
              isArtist={isArtist} 
              isChart={isChart}
              showProgress={showProgress}
              isNew={isNew}
              rank={showRank ? i + 1 : null}
            />
          ))}
        </div>
      </div>
    </motion.section>
  )
}
