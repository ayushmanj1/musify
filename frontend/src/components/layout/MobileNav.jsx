import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function MobileNav() {
  const { setIsSearchOpen } = usePlayer()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] z-[70] flex items-center justify-around px-6 pb-2" style={{ background: 'rgba(6,6,8,0.75)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-lavender' : 'text-white/35 hover:text-white/60'}`}>
        <FiHome className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
      </NavLink>
      <button 
        onClick={() => setIsSearchOpen(true)}
        className="flex flex-col items-center gap-1.5 text-white/35 hover:text-white/60 transition-all duration-300"
      >
        <FiSearch className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
      </button>
      <NavLink to="/library" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-lavender' : 'text-white/35 hover:text-white/60'}`}>
        <VscLibrary className="text-xl" />
        <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
      </NavLink>
    </div>
  )
}
