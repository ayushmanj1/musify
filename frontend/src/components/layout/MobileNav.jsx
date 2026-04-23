import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function MobileNav() {
  const { setIsSearchOpen } = usePlayer()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black/80 backdrop-blur-3xl border-t border-white/5 z-[70] flex items-center justify-around px-6 pb-2">
      <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#A78BFA]' : 'text-white/40'}`}>
        <FiHome className="text-2xl" />
      </NavLink>
      <button 
        onClick={() => setIsSearchOpen(true)}
        className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all duration-300"
      >
        <FiSearch className="text-2xl" />
      </button>
      <NavLink to="/library" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#A78BFA]' : 'text-white/40'}`}>
        <VscLibrary className="text-2xl" />
      </NavLink>
    </div>
  )
}
