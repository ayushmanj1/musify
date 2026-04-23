import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch, FiHeart } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { haptics } from '../../utils/haptics.js'

export default function MobileNav() {
  const { setIsSearchOpen } = usePlayer()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] z-[70] flex items-center justify-around px-6 pb-2" style={{ background: 'rgba(6,6,8,0.75)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <NavLink to="/" onClick={() => haptics.light()} className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-lavender' : 'text-white/35 hover:text-white/60'}`}>
        <FiHome className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
      </NavLink>
      <button 
        onClick={() => {
          haptics.light()
          setIsSearchOpen(true)
        }}
        className="flex flex-col items-center gap-1.5 text-white/35 hover:text-white/60 transition-all duration-300"
      >
        <FiSearch className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
      </button>
      <NavLink to="/library" onClick={() => haptics.light()} className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-lavender' : 'text-white/35 hover:text-white/60'}`}>
        <FiHeart className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Liked</span>
      </NavLink>
    </div>
  )
}
